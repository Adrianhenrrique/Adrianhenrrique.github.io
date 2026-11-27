-- ZoomERP Fase 1.1 — produtos e categorias, preços inteiros em centavos.
-- Não há saldo de estoque nesta etapa: a Fase 1.2 terá ledger de movimentações.
begin;

create table public.categorias_produto (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete restrict,
  nome text not null check (char_length(btrim(nome)) between 2 and 80),
  created_by uuid not null default auth.uid() references auth.users(id),
  updated_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (empresa_id, id)
);
create unique index categorias_produto_nome_empresa_unique
  on public.categorias_produto (empresa_id, lower(btrim(nome)));
create index categorias_produto_empresa_idx on public.categorias_produto (empresa_id, nome);

create table public.produtos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete restrict,
  categoria_id uuid,
  codigo text check (codigo is null or char_length(btrim(codigo)) between 1 and 40),
  nome text not null check (char_length(btrim(nome)) between 2 and 150),
  descricao text not null default '' check (char_length(descricao) <= 1000),
  unidade text not null default 'un' check (unidade in ('un','kg','g','l','ml','cx','pct')),
  preco_venda_centavos bigint not null check (preco_venda_centavos between 0 and 99999999999),
  custo_centavos bigint not null default 0 check (custo_centavos between 0 and 99999999999),
  ativo boolean not null default true,
  created_by uuid not null default auth.uid() references auth.users(id),
  updated_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categoria_mesma_empresa foreign key (empresa_id, categoria_id)
    references public.categorias_produto(empresa_id, id) on update restrict on delete restrict
);
create unique index produtos_codigo_empresa_unique
  on public.produtos (empresa_id, lower(btrim(codigo))) where codigo is not null;
create index produtos_busca_empresa_idx on public.produtos (empresa_id, nome, id);
create index produtos_categoria_empresa_idx on public.produtos (empresa_id, categoria_id);

-- Identidade e empresa imutáveis. Atualização sempre atualiza autor e data.
-- Essa função é invoker; não aumenta os privilégios do usuário.
create or replace function private.erp_catalogo_trilha()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare v_actor uuid := auth.uid();
begin
  if v_actor is null then raise exception 'Autenticação obrigatória' using errcode = '42501'; end if;
  if tg_op = 'INSERT' then
    new.created_by := v_actor;
    new.updated_by := v_actor;
    new.created_at := now();
    new.updated_at := now();
  else
    if new.empresa_id is distinct from old.empresa_id
       or new.id is distinct from old.id
       or new.created_by is distinct from old.created_by
       or new.created_at is distinct from old.created_at then
      raise exception 'Não é permitido transferir registros entre empresas ou alterar autoria' using errcode='42501';
    end if;
    new.updated_by := v_actor;
    new.updated_at := now();
  end if;
  return new;
end;
$$;
revoke all on function private.erp_catalogo_trilha() from public, anon;
grant execute on function private.erp_catalogo_trilha() to authenticated;

create trigger catalogo_categoria_trilha before insert or update on public.categorias_produto
for each row execute function private.erp_catalogo_trilha();
create trigger catalogo_produto_trilha before insert or update on public.produtos
for each row execute function private.erp_catalogo_trilha();

alter table public.categorias_produto enable row level security;
alter table public.produtos enable row level security;

-- Leitura a membros; criação/edição apenas ao dono. Exclusão vedada: produto é arquivado.
create policy categorias_produto_select on public.categorias_produto for select to authenticated
  using (private.eh_membro(empresa_id));
create policy categorias_produto_insert on public.categorias_produto for insert to authenticated
  with check (private.eh_dono(empresa_id) and created_by = (select auth.uid()));
create policy categorias_produto_update on public.categorias_produto for update to authenticated
  using (private.eh_dono(empresa_id))
  with check (private.eh_dono(empresa_id) and updated_by = (select auth.uid()));

create policy produtos_select on public.produtos for select to authenticated
  using (private.eh_membro(empresa_id));
create policy produtos_insert on public.produtos for insert to authenticated
  with check (private.eh_dono(empresa_id) and created_by = (select auth.uid()));
create policy produtos_update on public.produtos for update to authenticated
  using (private.eh_dono(empresa_id))
  with check (private.eh_dono(empresa_id) and updated_by = (select auth.uid()));

revoke all on public.categorias_produto, public.produtos from anon, authenticated;
grant select, insert, update on public.categorias_produto, public.produtos to authenticated;

comment on table public.produtos is 'Catálogo por empresa; preços/custos em centavos. Sem saldo, ledger ou movimento de estoque nesta fase.';
comment on table public.categorias_produto is 'Categorias isoladas por empresa; FK composta impede associação cruzada.';
commit;
