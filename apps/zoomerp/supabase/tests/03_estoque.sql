-- Executar somente em Supabase local isolado, depois de aplicar o candidato.
\set ON_ERROR_STOP on
begin;
insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at)
values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','00000000-0000-0000-0000-000000000000','authenticated','authenticated','estoque-a@exemplo.invalid','',now()),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','00000000-0000-0000-0000-000000000000','authenticated','authenticated','estoque-b@exemplo.invalid','',now());
set local role authenticated;
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
select set_config('zoomerp.empresa_a',public.criar_empresa('Estoque Teste A',null,'outros')::text,true);
do $$
declare
 e uuid := current_setting('zoomerp.empresa_a')::uuid;
 p uuid; entrada uuid; saida uuid; req uuid := gen_random_uuid();
begin
 insert into public.produtos(empresa_id,nome,unidade,preco_venda_centavos)
 values(e,'Produto teste','kg',100) returning id into p;
 entrada := public.registrar_estoque(e,p,'entrada',10.125,'Compra teste',req);
 if public.registrar_estoque(e,p,'entrada',10.125,'Compra teste',req) <> entrada then
   raise exception 'Falha de idempotência'; end if;
 begin
   perform public.registrar_estoque(e,p,'entrada',2,'Compra teste',req);
   raise exception 'Falha: chave reaproveitada com payload diferente';
 exception when invalid_parameter_value then null; end;
 saida := public.registrar_estoque(e,p,'saida',2.125,'Saída teste',gen_random_uuid());
 if (select saldo from public.estoque_saldos where produto_id=p) is distinct from 8::numeric then
   raise exception 'Saldo errado'; end if;
 begin
   perform public.registrar_estoque(e,p,'saida',9,'Saída excedente',gen_random_uuid());
   raise exception 'Falha: saldo negativo';
 exception when invalid_parameter_value then null; end;
 perform public.registrar_estoque(e,p,'estorno',null,'Estorno teste',gen_random_uuid(),saida);
 begin
   perform public.registrar_estoque(e,p,'estorno',null,'Estorno repetido',gen_random_uuid(),saida);
   raise exception 'Falha: estorno duplicado';
 exception when invalid_parameter_value then null; end;
 perform public.registrar_estoque(e,p,'ajuste',3.5,'Contagem física',gen_random_uuid());
 if (select saldo from public.estoque_saldos where produto_id=p) is distinct from 3.5::numeric
 or (select sum(delta) from public.estoque_movimentos where produto_id=p) is distinct from 3.5::numeric
 or (select count(*) from public.estoque_movimentos where produto_id=p)<>4 then
   raise exception 'Falha: ledger ou saldo incoerente'; end if;
 begin
   update public.estoque_saldos set saldo=999 where produto_id=p;
   raise exception 'Falha: escrita direta';
 exception when insufficient_privilege then null; end;
 begin
   delete from public.estoque_movimentos where produto_id=p;
   raise exception 'Falha: histórico apagável';
 exception when insufficient_privilege then null; end;
 begin
   update public.produtos set unidade='un' where id=p;
   raise exception 'Falha: unidade alterada';
 exception when invalid_parameter_value then null; end;
 perform set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true);
 if exists(select 1 from public.estoque_movimentos where produto_id=p)
 or exists(select 1 from public.estoque_saldos where produto_id=p) then
   raise exception 'Falha: vazamento de estoque'; end if;
 begin
   perform public.registrar_estoque(e,p,'entrada',1,'Intruso teste',gen_random_uuid());
   raise exception 'Falha: operação cruzada';
 exception when insufficient_privilege then null; end;
end $$;
rollback;
