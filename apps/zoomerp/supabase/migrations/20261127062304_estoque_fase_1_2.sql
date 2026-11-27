-- Candidato de migration 1.2. Aplicar apenas em banco isolado para validação.
begin;
alter table public.produtos add constraint produtos_empresa_id_unique unique (empresa_id,id);

-- NULL desativa o alerta; zero é um limite válido. Não arredondar entradas inválidas.
alter table public.produtos add column estoque_minimo numeric;
alter table public.produtos add constraint produtos_estoque_minimo_valido check (
  estoque_minimo is null or (
    estoque_minimo between 0 and 999999999999999.999
    and estoque_minimo = trunc(estoque_minimo,3)
    and (unidade not in ('un','cx','pct') or estoque_minimo=trunc(estoque_minimo))
  )
);

create table public.estoque_saldos (
  empresa_id uuid not null,
  produto_id uuid not null,
  saldo numeric(18,3) not null default 0,
  atualizado_em timestamptz not null default now(),
  primary key (empresa_id,produto_id),
  foreign key (empresa_id,produto_id) references public.produtos(empresa_id,id) on delete restrict
);

create table public.estoque_movimentos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null,
  produto_id uuid not null,
  requisicao_id uuid not null,
  tipo text not null check (tipo in ('entrada','saida','ajuste','estorno')),
  quantidade_solicitada numeric(18,3),
  delta numeric(18,3) not null check (delta <> 0),
  saldo_anterior numeric(18,3) not null,
  saldo_posterior numeric(18,3) not null,
  motivo text not null check (char_length(btrim(motivo)) between 3 and 300),
  estorno_de uuid,
  autor_id uuid not null references auth.users(id),
  criado_em timestamptz not null default clock_timestamp(),
  unique (empresa_id,produto_id,id),
  unique (empresa_id,produto_id,requisicao_id),
  unique (estorno_de),
  foreign key (empresa_id,produto_id) references public.produtos(empresa_id,id) on delete restrict,
  foreign key (empresa_id,produto_id,estorno_de)
    references public.estoque_movimentos(empresa_id,produto_id,id) on delete restrict,
  check (saldo_posterior = saldo_anterior + delta),
  check ((tipo = 'estorno') = (estorno_de is not null)),
  check ((tipo = 'estorno') = (quantidade_solicitada is null)),
  check (tipo <> 'entrada' or delta > 0),
  check (tipo <> 'saida' or delta < 0)
);
create index estoque_movimentos_historico_idx
  on public.estoque_movimentos(empresa_id,produto_id,criado_em desc,id desc);

alter table public.estoque_saldos enable row level security;
alter table public.estoque_movimentos enable row level security;
create policy estoque_saldos_leitura on public.estoque_saldos for select to authenticated
  using (private.eh_membro(empresa_id));
create policy estoque_movimentos_leitura on public.estoque_movimentos for select to authenticated
  using (private.eh_membro(empresa_id));
revoke all on public.estoque_saldos,public.estoque_movimentos from public,anon,authenticated;
grant select on public.estoque_saldos,public.estoque_movimentos to authenticated;

-- A leitura é executada com o papel do solicitante, preservando RLS de ambas as tabelas.
-- Saldo e limite em texto preservam precisão decimal na API.
create view public.estoque_catalogo with (security_invoker=true) as
select p.id,p.empresa_id,p.nome,p.codigo,p.categoria_id,p.preco_venda_centavos,
       p.unidade,p.ativo,p.created_at,
       coalesce(s.saldo,0)::text as saldo,
       p.estoque_minimo::numeric(18,3)::text as estoque_minimo,
       (p.estoque_minimo is not null and coalesce(s.saldo,0)<=p.estoque_minimo) as reposicao
from public.produtos p
left join public.estoque_saldos s on s.empresa_id=p.empresa_id and s.produto_id=p.id;
revoke all on public.estoque_catalogo from public,anon,authenticated;
grant select on public.estoque_catalogo to authenticated;

-- Uma unidade não pode mudar depois de existir histórico naquela unidade.
create function private.estoque_proteger_unidade() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if new.unidade is distinct from old.unidade and old.estoque_minimo is not null then
    raise exception 'ESTOQUE_LIMITE_UNIDADE' using errcode='22023';
  end if;
  if new.unidade is distinct from old.unidade and exists (
    select 1 from public.estoque_movimentos m where m.empresa_id=old.empresa_id and m.produto_id=old.id
  ) then raise exception 'ESTOQUE_UNIDADE_IMUTAVEL' using errcode='22023'; end if;
  return new;
end $$;
revoke all on function private.estoque_proteger_unidade() from public,anon;
grant execute on function private.estoque_proteger_unidade() to authenticated;
create trigger estoque_proteger_unidade before update of unidade on public.produtos
for each row execute function private.estoque_proteger_unidade();

-- Operação única, serializada por produto. Não expõe o definer na API pública.
create function private.estoque_registrar(
  p_empresa uuid,p_produto uuid,p_tipo text,p_quantidade numeric,p_motivo text,
  p_requisicao uuid,p_estorno uuid
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  ator uuid := auth.uid();
  produto public.produtos%rowtype;
  anterior public.estoque_movimentos%rowtype;
  origem public.estoque_movimentos%rowtype;
  atual numeric(18,3);
  variacao numeric(18,3);
  novo numeric(18,3);
  resultado uuid;
  motivo_limpo text := btrim(p_motivo);
  bloquear boolean;
begin
  if ator is null or not coalesce(private.eh_dono(p_empresa),false) then
    raise exception 'ESTOQUE_PERMISSAO' using errcode='42501';
  end if;
  if p_requisicao is null or p_tipo is null or p_tipo not in ('entrada','saida','ajuste','estorno')
    or motivo_limpo is null or char_length(motivo_limpo) not between 3 and 300
    or ((p_tipo='estorno') <> (p_estorno is not null))
    or ((p_tipo='estorno') <> (p_quantidade is null)) then
    raise exception 'ESTOQUE_DADOS' using errcode='22023';
  end if;
  if p_quantidade is not null and
    (p_quantidade::text in ('NaN','Infinity','-Infinity') or p_quantidade < 0 or p_quantidade > 999999999999999.999 or
     p_quantidade <> trunc(p_quantidade,3) or
     (p_tipo in ('entrada','saida') and p_quantidade=0)) then
    raise exception 'ESTOQUE_QUANTIDADE' using errcode='22023';
  end if;
  select * into produto from public.produtos
    where empresa_id=p_empresa and id=p_produto for update;
  if not found then raise exception 'ESTOQUE_PRODUTO' using errcode='22023'; end if;

  select * into anterior from public.estoque_movimentos
    where empresa_id=p_empresa and produto_id=p_produto and requisicao_id=p_requisicao;
  if found then
    if anterior.autor_id<>ator or anterior.tipo<>p_tipo
      or anterior.quantidade_solicitada is distinct from p_quantidade
      or anterior.estorno_de is distinct from p_estorno or anterior.motivo<>motivo_limpo then
      raise exception 'ESTOQUE_REQUISICAO_CONFLITO' using errcode='22023';
    end if;
    return anterior.id;
  end if;

  if not produto.ativo and p_tipo<>'estorno' then
    raise exception 'ESTOQUE_ARQUIVADO' using errcode='22023';
  end if;
  if produto.unidade in ('un','cx','pct') and p_quantidade<>trunc(p_quantidade) then
    raise exception 'ESTOQUE_QUANTIDADE_INTEIRA' using errcode='22023';
  end if;
  select saldo into atual from public.estoque_saldos
    where empresa_id=p_empresa and produto_id=p_produto;
  atual := coalesce(atual,0);
  if p_tipo='estorno' then
    select * into origem from public.estoque_movimentos
      where empresa_id=p_empresa and produto_id=p_produto and id=p_estorno;
    if not found or origem.tipo='estorno' or exists (
      select 1 from public.estoque_movimentos where estorno_de=p_estorno
    ) then raise exception 'ESTOQUE_ESTORNO_INVALIDO' using errcode='22023'; end if;
    variacao := -origem.delta;
  elsif p_tipo='entrada' then variacao := p_quantidade;
  elsif p_tipo='saida' then variacao := -p_quantidade;
  else variacao := p_quantidade-atual;
  end if;
  if variacao=0 then raise exception 'ESTOQUE_SEM_ALTERACAO' using errcode='22023'; end if;
  novo := atual+variacao;
  select coalesce(configuracoes->'bloquear_estoque_negativo' <> 'false'::jsonb,true)
    into bloquear from public.empresas where id=p_empresa;
  if novo<0 and coalesce(bloquear,true) then
    raise exception 'ESTOQUE_INSUFICIENTE' using errcode='22023';
  end if;
  insert into public.estoque_movimentos(empresa_id,produto_id,requisicao_id,tipo,
    quantidade_solicitada,delta,saldo_anterior,saldo_posterior,motivo,estorno_de,autor_id)
    values(p_empresa,p_produto,p_requisicao,p_tipo,p_quantidade,variacao,atual,novo,motivo_limpo,p_estorno,ator)
    returning id into resultado;
  insert into public.estoque_saldos(empresa_id,produto_id,saldo)
    values(p_empresa,p_produto,novo)
    on conflict (empresa_id,produto_id) do update set saldo=excluded.saldo,atualizado_em=clock_timestamp();
  return resultado;
end $$;
revoke all on function private.estoque_registrar(uuid,uuid,text,numeric,text,uuid,uuid) from public,anon;
grant execute on function private.estoque_registrar(uuid,uuid,text,numeric,text,uuid,uuid) to authenticated;

create function public.registrar_estoque(
  p_empresa uuid,p_produto uuid,p_tipo text,p_quantidade numeric,p_motivo text,
  p_requisicao uuid,p_estorno uuid default null
) returns uuid language sql security invoker set search_path = '' as $$
  select private.estoque_registrar(p_empresa,p_produto,p_tipo,p_quantidade,p_motivo,p_requisicao,p_estorno);
$$;
revoke all on function public.registrar_estoque(uuid,uuid,text,numeric,text,uuid,uuid) from public,anon;
grant execute on function public.registrar_estoque(uuid,uuid,text,numeric,text,uuid,uuid) to authenticated;
comment on table public.estoque_saldos is 'Saldo materializado por produto; ausência de linha representa zero.';
comment on table public.estoque_movimentos is 'Histórico de estoque append-only para papéis da aplicação.';
commit;
