-- Teste transacional de contatos, somente homologação/local. Rollback obrigatório.
begin;
insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at) values
('a1300000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','contato-a@exemplo.invalid','',now()),
('a1300000-0000-4000-8000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','contato-b@exemplo.invalid','',now());
set local role authenticated;
select set_config('request.jwt.claim.sub','a1300000-0000-4000-8000-000000000001',true);
select set_config('zoomerp.contatos_a',public.criar_empresa('Contatos teste A',null,'outros')::text,true);
select set_config('zoomerp.contatos_a2',public.criar_empresa('Contatos teste A2',null,'outros')::text,true);
do $$
declare a uuid:=current_setting('zoomerp.contatos_a')::uuid; a2 uuid:=current_setting('zoomerp.contatos_a2')::uuid; c uuid;
begin
 insert into public.contatos(empresa_id,tipo,nome,documento,telefone,email) values(a,'cliente','Cliente teste','52998224725','11999999999','teste@exemplo.invalid') returning id into c;
 insert into public.contatos(empresa_id,tipo,nome,documento) values(a,'fornecedor','Fornecedor teste','52998224725');
 insert into public.contatos(empresa_id,tipo,nome,documento) values(a2,'cliente','Outro cliente','52998224725');
 if not exists(select 1 from public.contatos where id=c and created_by=auth.uid()) then raise exception 'Falha de autoria'; end if;
 begin insert into public.contatos(empresa_id,tipo,nome,documento) values(a,'cliente','Duplicado','52998224725'); raise exception 'Duplicado aceito'; exception when unique_violation then null; end;
 begin insert into public.contatos(empresa_id,tipo,nome,documento) values(a,'cliente','Inválido','11111111111'); raise exception 'CPF inválido aceito'; exception when check_violation then null; end;
 begin update public.contatos set tipo='fornecedor' where id=c; raise exception 'Tipo alterável'; exception when insufficient_privilege then null; end;
 begin update public.contatos set empresa_id=a2 where id=c; raise exception 'Empresa alterável'; exception when insufficient_privilege then null; end;
 begin delete from public.contatos where id=c; raise exception 'Exclusão permitida'; exception when insufficient_privilege then null; end;
 update public.contatos set ativo=false,nome='Cliente arquivado' where id=c;
 if not exists(select 1 from public.contatos where id=c and not ativo and nome='Cliente arquivado') then raise exception 'Arquivo falhou'; end if;
 update public.contatos set ativo=true where id=c;
 if not exists(select 1 from public.contatos where id=c and ativo) then raise exception 'Reativação falhou'; end if;
end $$;
select set_config('request.jwt.claim.sub','a1300000-0000-4000-8000-000000000002',true);
select set_config('zoomerp.contatos_b',public.criar_empresa('Contatos teste B',null,'outros')::text,true);
do $$
declare a uuid:=current_setting('zoomerp.contatos_a')::uuid;
begin
 if exists(select 1 from public.contatos where empresa_id=a) then raise exception 'Vazamento para outra empresa'; end if;
 begin insert into public.contatos(empresa_id,tipo,nome) values(a,'cliente','Intruso'); raise exception 'Escrita cruzada permitida'; exception when insufficient_privilege then null; end;
 update public.contatos set nome='Intruso' where empresa_id=a; if found then raise exception 'Atualização cruzada permitida'; end if;
end $$;
reset role;
insert into public.usuarios_empresa(empresa_id,usuario_id,papel,created_by) values(current_setting('zoomerp.contatos_a')::uuid,'a1300000-0000-4000-8000-000000000002','funcionario','a1300000-0000-4000-8000-000000000001');
set local role authenticated;
select set_config('request.jwt.claim.sub','a1300000-0000-4000-8000-000000000002',true);
do $$
declare a uuid:=current_setting('zoomerp.contatos_a')::uuid;
begin
 if (select count(*) from public.contatos where empresa_id=a)<>2 then raise exception 'Funcionário não lê contatos'; end if;
 begin insert into public.contatos(empresa_id,tipo,nome) values(a,'cliente','Funcionário teste'); raise exception 'Funcionário criou contato'; exception when insufficient_privilege then null; end;
 update public.contatos set ativo=false where empresa_id=a; if found then raise exception 'Funcionário alterou contato'; end if;
end $$;
rollback;
