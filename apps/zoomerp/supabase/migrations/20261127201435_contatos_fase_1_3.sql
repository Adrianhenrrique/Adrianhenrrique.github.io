-- ZoomERP 1.3: cadastros de clientes e fornecedores por empresa.
begin;
create table public.contatos (
 id uuid primary key default gen_random_uuid(),
 empresa_id uuid not null references public.empresas(id) on delete restrict,
 tipo text not null check (tipo in ('cliente','fornecedor')),
 nome text not null check (char_length(btrim(nome)) between 2 and 150),
 documento text check (documento is null or (documento ~ '^([0-9]{11}|[0-9]{14})$' and private.documento_valido(documento))),
 telefone text check (telefone is null or telefone ~ '^[0-9]{8,15}$'),
 email text check (email is null or (char_length(email)<=254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$')),
 cep text check (cep is null or cep ~ '^[0-9]{8}$'),
 endereco text not null default '' check (char_length(endereco)<=250),
 cidade text not null default '' check (char_length(cidade)<=100),
 uf text check (uf is null or uf in ('AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO')),
 observacoes text not null default '' check (char_length(observacoes)<=1000),
 ativo boolean not null default true,
 created_by uuid not null default auth.uid() references auth.users(id),
 updated_by uuid not null default auth.uid() references auth.users(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(empresa_id,id)
);
create unique index contatos_documento_tipo_unique on public.contatos(empresa_id,tipo,documento) where documento is not null;
create index contatos_listagem_idx on public.contatos(empresa_id,tipo,ativo,nome,id);
create index contatos_created_by_idx on public.contatos(created_by);
create index contatos_updated_by_idx on public.contatos(updated_by);
create function private.erp_contato_tipo_imutavel() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 if new.tipo is distinct from old.tipo then raise exception 'Tipo de contato imutável' using errcode='42501'; end if;
 return new;
end $$;
revoke all on function private.erp_contato_tipo_imutavel() from public,anon;
grant execute on function private.erp_contato_tipo_imutavel() to authenticated;
create trigger contatos_trilha before insert or update on public.contatos
 for each row execute function private.erp_catalogo_trilha();
create trigger contatos_tipo_imutavel before update of tipo on public.contatos
 for each row execute function private.erp_contato_tipo_imutavel();
alter table public.contatos enable row level security;
revoke all on public.contatos from public,anon,authenticated;
grant select,insert,update on public.contatos to authenticated;
create policy contatos_select on public.contatos for select to authenticated using (private.eh_membro(empresa_id));
create policy contatos_insert on public.contatos for insert to authenticated with check (private.eh_dono(empresa_id) and created_by=(select auth.uid()));
create policy contatos_update on public.contatos for update to authenticated using (private.eh_dono(empresa_id)) with check (private.eh_dono(empresa_id) and updated_by=(select auth.uid()));
comment on table public.contatos is 'Clientes e fornecedores por empresa. Mesmo documento permitido em papéis distintos; arquivamento em vez de exclusão.';
commit;

