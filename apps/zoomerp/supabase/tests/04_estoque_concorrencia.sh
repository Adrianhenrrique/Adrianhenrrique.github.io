#!/usr/bin/env bash
# Uso exclusivo em Supabase local descartável, com migrations + candidato aplicados.
set -euo pipefail
: "${SUPABASE_TEST_DATABASE_URL:?Informe a URL do banco Supabase local}"
: "${ZOOMERP_ALLOW_LOCAL_FIXTURES:?Defina como yes para confirmar banco descartável}"
[[ "$ZOOMERP_ALLOW_LOCAL_FIXTURES" == yes ]]
# Evita conexões remotas por acidente. Ainda exige banco descartável sem proxy/túnel.
[[ "$SUPABASE_TEST_DATABASE_URL" =~ ^postgres(ql)?://[^/@?]+@(localhost|127\.0\.0\.1):[0-9]+/[a-zA-Z0-9_]+$ ]] || { echo "Somente URL PostgreSQL local sem parâmetros" >&2; exit 1; }
command -v psql >/dev/null
command -v node >/dev/null
sql() { psql "$SUPABASE_TEST_DATABASE_URL" -X -qAt -v ON_ERROR_STOP=1 "$@"; }
uuid() { node -e 'console.log(require("node:crypto").randomUUID())'; }
owner=$(uuid); company=$(uuid); product=$(uuid); first=$(uuid); second=$(uuid); retry=$(uuid)
tmp=$(mktemp -d)
cleanup() {
  sql -v owner="$owner" -v company="$company" -v product="$product" <<'SQL' || echo "Falha na limpeza das fixtures locais" >&2
begin;
delete from public.estoque_movimentos where empresa_id=:'company' and produto_id=:'product';
delete from public.estoque_saldos where empresa_id=:'company' and produto_id=:'product';
delete from public.produtos where empresa_id=:'company' and id=:'product';
delete from public.usuarios_empresa where empresa_id=:'company' and usuario_id=:'owner';
delete from public.empresas where id=:'company' and created_by=:'owner';
delete from auth.users where id=:'owner';
commit;
SQL
  rm -rf "$tmp"
}
trap cleanup EXIT
sql -v owner="$owner" -v company="$company" -v product="$product" <<'SQL'
begin;
insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at)
values(:'owner','00000000-0000-0000-0000-000000000000','authenticated','authenticated',:'owner'||'@teste.invalid','',now());
insert into public.empresas(id,nome,created_by) values(:'company','Teste concorrente',:'owner');
insert into public.usuarios_empresa(empresa_id,usuario_id,papel,created_by) values(:'company',:'owner','dono',:'owner');
set local role authenticated;
select set_config('request.jwt.claim.sub',:'owner',true) as actor \gset
insert into public.produtos(id,empresa_id,nome,unidade,preco_venda_centavos)
values(:'product',:'company','Produto concorrente','un',100);
select public.registrar_estoque(:'company',:'product','entrada',10,'Saldo inicial',gen_random_uuid()) as id \gset
commit;
SQL
movement() {
  local kind="$1" amount="$2" key="$3"
  sql -v owner="$owner" -v company="$company" -v product="$product" -v kind="$kind" -v amount="$amount" -v key="$key" <<'SQL'
begin;
set local lock_timeout='10s';
set local statement_timeout='15s';
set local role authenticated;
select set_config('request.jwt.claim.sub',:'owner',true) as actor \gset
select public.registrar_estoque(:'company',:'product',:'kind',:'amount'::numeric,'Teste concorrente',:'key');
-- Mantém lock da linha após a RPC para exercitar a segunda sessão.
select pg_sleep(0.5) as slept \gset
commit;
SQL
}
movement saida 7 "$first" >"$tmp/a" 2>"$tmp/a.err" & a=$!
movement saida 7 "$second" >"$tmp/b" 2>"$tmp/b.err" & b=$!
ra=0; rb=0; wait "$a" || ra=$?; wait "$b" || rb=$?
if [[ "$ra" -eq 0 && "$rb" -ne 0 ]]; then grep -q ESTOQUE_INSUFICIENTE "$tmp/b.err"
elif [[ "$rb" -eq 0 && "$ra" -ne 0 ]]; then grep -q ESTOQUE_INSUFICIENTE "$tmp/a.err"
else cat "$tmp/"*.err >&2; echo "Esperava exatamente uma saída aceita" >&2; exit 1; fi
movement entrada 2 "$retry" >"$tmp/c" 2>"$tmp/c.err" & c=$!
movement entrada 2 "$retry" >"$tmp/d" 2>"$tmp/d.err" & d=$!
rc=0; rd=0; wait "$c" || rc=$?; wait "$d" || rd=$?
[[ "$rc" -eq 0 && "$rd" -eq 0 ]] || { cat "$tmp/"*.err >&2; exit 1; }
[[ -s "$tmp/c" && -s "$tmp/d" ]]
cmp "$tmp/c" "$tmp/d"
result=$(sql -v company="$company" -v product="$product" <<'SQL'
select (s.saldo=5 and count(m.id)=3 and sum(m.delta)=s.saldo)::text
from public.estoque_saldos s join public.estoque_movimentos m using(empresa_id,produto_id)
where s.empresa_id=:'company' and s.produto_id=:'product' group by s.saldo;
SQL
)
[[ "$result" == true ]] || { echo "Saldo ou histórico divergente: $result" >&2; exit 1; }
echo "OK: duas saídas disputadas, idempotência simultânea e saldo final 5."
