-- Executar SOMENTE contra o Supabase LOCAL de teste; as inclusões de usuários abaixo
-- são dados sintéticos, e tudo é desfeito com ROLLBACK.
-- Pré-requisito: aplicar a migração 202611270001_auth_multiempresa.sql.
\set ON_ERROR_STOP on
begin;
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','00000000-0000-0000-0000-000000000000','authenticated','authenticated','teste-a@exemplo.invalid','',now()),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','00000000-0000-0000-0000-000000000000','authenticated','authenticated','teste-b@exemplo.invalid','',now());
set local role authenticated;
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
select set_config('zoomerp.test_empresa_a', public.criar_empresa('Empresa Teste A',null,'outros')::text,true);
select set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true);
select set_config('zoomerp.test_empresa_b', public.criar_empresa('Empresa Teste B',null,'outros')::text,true);

do $$ begin
  if (select count(*) from public.empresas) <> 1 then raise exception 'Falha: usuário B enxerga outra empresa'; end if;
  if (select nome from public.empresas limit 1) <> 'Empresa Teste B' then raise exception 'Falha: empresa errada para B'; end if;
  if (select count(*) from public.usuarios_empresa) <> 1 then raise exception 'Falha: usuário B enxerga membros de A'; end if;
end $$;

select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
do $$ begin
  if (select count(*) from public.empresas) <> 1 then raise exception 'Falha: usuário A enxerga outra empresa'; end if;
  if (select nome from public.empresas limit 1) <> 'Empresa Teste A' then raise exception 'Falha: empresa errada para A'; end if;
  if (select count(*) from public.usuarios_empresa) <> 1 then raise exception 'Falha: usuário A enxerga membros de B'; end if;
end $$;

-- A conta A não deve conseguir escalar privilégios com INSERT direto.
do $$ begin
  insert into public.usuarios_empresa(empresa_id,usuario_id,papel,created_by)
    select id,'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','dono','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
    from public.empresas where nome = 'Empresa Teste A';
  raise exception 'Falha: INSERT direto na tabela de membros foi aceito';
exception when insufficient_privilege then null;
end $$;

-- Mesmo como dono, A não pode criar convite em empresa pertencente a B.
do $$ begin
  perform public.criar_convite_funcionario(
    current_setting('zoomerp.test_empresa_b')::uuid, 'funcionario@exemplo.invalid');
  raise exception 'Falha: convite cruzado foi aceito';
exception when insufficient_privilege then null;
end $$;
rollback;
