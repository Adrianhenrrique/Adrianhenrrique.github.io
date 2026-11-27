-- ZoomERP 0.2: uma empresa é criada com seu dono na mesma transação;
-- convites são por token aleatório, com hash no banco e e-mail confirmado.
-- Execute no Supabase SQL Editor (ou supabase db push) uma única vez.
begin;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table if not exists public.empresas (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(btrim(nome)) between 2 and 120),
  documento text check (documento is null or documento ~ '^[0-9]{11}([0-9]{3})?$'),
  ramo text not null default 'outros',
  logo_url text,
  plano text not null default 'gratis' check (plano in ('gratis','essencial','pro')),
  trial_ate timestamptz not null default (now() + interval '14 days'),
  configuracoes jsonb not null default '{"bloquear_estoque_negativo":true}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id)
);

create table if not exists public.usuarios_empresa (
  empresa_id uuid not null references public.empresas(id),
  usuario_id uuid not null references auth.users(id),
  papel text not null check (papel in ('dono', 'funcionario')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),
  primary key (empresa_id, usuario_id)
);

create table if not exists public.convites_empresa (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id),
  email text not null check (char_length(email) <= 254),
  papel text not null default 'funcionario' check (papel = 'funcionario'),
  token_hash text not null unique,
  expira_em timestamptz not null,
  aceito_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id)
);

create index if not exists idx_usuarios_empresa_usuario on public.usuarios_empresa(usuario_id, empresa_id);
create index if not exists idx_convites_empresa_abertos on public.convites_empresa(empresa_id, expira_em) where aceito_em is null;

create or replace function private.atualizar_timestamp()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger atualiza_empresas_timestamp before update on public.empresas
for each row execute function private.atualizar_timestamp();
create trigger atualiza_usuarios_empresa_timestamp before update on public.usuarios_empresa
for each row execute function private.atualizar_timestamp();
create trigger atualiza_convites_timestamp before update on public.convites_empresa
for each row execute function private.atualizar_timestamp();

-- Evita recursão de RLS na tabela de vínculos. Essas funções não aceitam ID de usuário:
-- sempre consultam auth.uid(), proveniente do JWT validado pelo Supabase.
create or replace function private.eh_membro(p_empresa uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.usuarios_empresa u
    where u.empresa_id = p_empresa and u.usuario_id = (select auth.uid())
  );
$$;
create or replace function private.eh_dono(p_empresa uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.usuarios_empresa u
    where u.empresa_id = p_empresa and u.usuario_id = (select auth.uid()) and u.papel = 'dono'
  );
$$;

-- Validação de CPF/CNPJ numérico por dígitos verificadores, também aplicada no banco.
create or replace function private.documento_valido(p_documento text)
returns boolean language plpgsql immutable set search_path = '' as $$
declare
  d text := regexp_replace(coalesce(p_documento,''), '[^0-9]', '', 'g');
  s integer := 0;
  dv integer;
  i integer;
  w integer[];
begin
  if d = '' then return true; end if;
  if d ~ '^([0-9])\1+$' then return false; end if;
  if length(d) = 11 then
    for i in 1..9 loop s := s + substring(d,i,1)::int * (11-i); end loop;
    dv := (s * 10) % 11;
    if dv = 10 then dv := 0; end if;
    if dv <> substring(d,10,1)::int then return false; end if;
    s := 0;
    for i in 1..10 loop s := s + substring(d,i,1)::int * (12-i); end loop;
    dv := (s * 10) % 11;
    if dv = 10 then dv := 0; end if;
    return dv = substring(d,11,1)::int;
  elsif length(d) = 14 then
    w := array[5,4,3,2,9,8,7,6,5,4,3,2];
    for i in 1..12 loop s := s + substring(d,i,1)::int * w[i]; end loop;
    dv := case when s % 11 < 2 then 0 else 11 - s % 11 end;
    if dv <> substring(d,13,1)::int then return false; end if;
    s := 0;
    w := array[6,5,4,3,2,9,8,7,6,5,4,3,2];
    for i in 1..13 loop s := s + substring(d,i,1)::int * w[i]; end loop;
    dv := case when s % 11 < 2 then 0 else 11 - s % 11 end;
    return dv = substring(d,14,1)::int;
  end if;
  return false;
end;
$$;

alter table public.empresas enable row level security;
alter table public.usuarios_empresa enable row level security;
alter table public.convites_empresa enable row level security;

-- Sem políticas de INSERT/UPDATE/DELETE diretas: não é permitido conceder papel 'dono'
-- ou trocar empresa_id manipulando chamadas da API. Alterações passam apenas pelas RPCs.
create policy empresas_leitura on public.empresas for select to authenticated
  using (private.eh_membro(id));
create policy membros_leitura on public.usuarios_empresa for select to authenticated
  using (usuario_id = (select auth.uid()) or private.eh_dono(empresa_id));
create policy convites_leitura on public.convites_empresa for select to authenticated
  using (private.eh_dono(empresa_id));

revoke all on public.empresas, public.usuarios_empresa, public.convites_empresa from anon, authenticated;
grant select on public.empresas, public.usuarios_empresa, public.convites_empresa to authenticated;

revoke all on function private.eh_membro(uuid), private.eh_dono(uuid), private.documento_valido(text), private.atualizar_timestamp() from public, anon;
grant execute on function private.eh_membro(uuid), private.eh_dono(uuid) to authenticated;

-- SECURITY DEFINER fica restrito a operações especificadas abaixo. Sem chave service_role na app.
create or replace function public.criar_empresa(p_nome text, p_documento text default null, p_ramo text default 'outros')
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_usuario uuid := auth.uid();
  v_empresa uuid;
  v_nome text := btrim(coalesce(p_nome,''));
  v_documento text := nullif(regexp_replace(coalesce(p_documento,''), '[^0-9]', '', 'g'), '');
begin
  if v_usuario is null then raise exception 'Faça login para continuar.' using errcode='28000'; end if;
  if char_length(v_nome) not between 2 and 120 then raise exception 'Informe o nome da empresa (2 a 120 caracteres).'; end if;
  if v_documento is not null and not private.documento_valido(v_documento) then
    raise exception 'CPF ou CNPJ inválido.';
  end if;
  insert into public.empresas(nome,documento,ramo,created_by)
    values (v_nome,v_documento,left(btrim(coalesce(p_ramo,'outros')),60),v_usuario) returning id into v_empresa;
  insert into public.usuarios_empresa(empresa_id,usuario_id,papel,created_by)
    values (v_empresa,v_usuario,'dono',v_usuario);
  return v_empresa;
end;
$$;

-- A função devolve o token apenas uma vez. Apenas hash SHA-256 permanece no banco.
-- O envio por e-mail NÃO é automático nesta etapa: dono copia o link para enviar.
create or replace function public.criar_convite_funcionario(p_empresa uuid, p_email text)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_usuario uuid := auth.uid();
  v_email text := lower(btrim(coalesce(p_email,'')));
  v_token text;
begin
  if v_usuario is null or not private.eh_dono(p_empresa) then
    raise exception 'Somente o dono pode convidar funcionários.' using errcode='42501';
  end if;
  if char_length(v_email) > 254 or v_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'E-mail inválido.';
  end if;
  if exists (select 1 from auth.users a join public.usuarios_empresa u on u.usuario_id=a.id
             where u.empresa_id=p_empresa and lower(a.email)=v_email) then
    raise exception 'Este usuário já faz parte da empresa.';
  end if;
  -- UUIDs v4 gerados independentemente: 244 bits aleatórios combinados.
  v_token := replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-','');
  insert into public.convites_empresa(empresa_id,email,token_hash,expira_em,created_by)
    values (p_empresa,v_email,encode(sha256(convert_to(v_token,'UTF8')),'hex'),now()+interval '7 days',v_usuario);
  return v_token;
end;
$$;

-- Convite só pode ser usado pela conta autenticada com o e-mail VERIFICADO indicado.
-- Bloqueio FOR UPDATE impede uso simultâneo do mesmo convite.
create or replace function public.aceitar_convite(p_token text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_usuario uuid := auth.uid();
  v_email text;
  v_convite public.convites_empresa%rowtype;
begin
  if v_usuario is null then raise exception 'Entre na sua conta para aceitar o convite.' using errcode='28000'; end if;
  select lower(email) into v_email from auth.users
    where id=v_usuario and email_confirmed_at is not null;
  if v_email is null then raise exception 'Confirme seu e-mail antes de aceitar o convite.'; end if;
  if p_token is null or p_token !~ '^[0-9a-f]{64}$' then raise exception 'Convite inválido.'; end if;
  select * into v_convite from public.convites_empresa
    where token_hash=encode(sha256(convert_to(p_token,'UTF8')),'hex') for update;
  if not found or v_convite.aceito_em is not null or v_convite.expira_em <= now() then
    raise exception 'Convite inválido ou expirado.';
  end if;
  if v_email <> v_convite.email then raise exception 'Este convite é destinado a outro e-mail.' using errcode='42501'; end if;
  if exists (select 1 from public.usuarios_empresa u where u.empresa_id=v_convite.empresa_id and u.usuario_id=v_usuario) then
    raise exception 'Você já faz parte desta empresa.';
  end if;
  insert into public.usuarios_empresa(empresa_id,usuario_id,papel,created_by)
    values (v_convite.empresa_id,v_usuario,'funcionario',v_convite.created_by);
  update public.convites_empresa set aceito_em=now() where id=v_convite.id;
  return v_convite.empresa_id;
end;
$$;

revoke all on function public.criar_empresa(text,text,text), public.criar_convite_funcionario(uuid,text), public.aceitar_convite(text) from public, anon;
grant execute on function public.criar_empresa(text,text,text), public.criar_convite_funcionario(uuid,text), public.aceitar_convite(text) to authenticated;

comment on table public.empresas is 'Organizações ZoomERP isoladas por RLS. O proprietário é cadastrado via criar_empresa.';
comment on table public.convites_empresa is 'Token do convite nunca é armazenado em texto puro e expira em 7 dias.';
commit;
