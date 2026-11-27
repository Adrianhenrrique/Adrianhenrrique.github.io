-- Teste de RLS e FK (execute em ambiente isolado ou transação de rollback).
-- Requer usuário autenticado dono de duas empresas. Nenhuma linha persiste.
begin;
select set_config('zoomerp.owner', (select usuario_id::text from public.usuarios_empresa limit 1), true);
select set_config('zoomerp.companyA', (select empresa_id::text from public.usuarios_empresa order by empresa_id limit 1), true);
select set_config('zoomerp.companyB', (select empresa_id::text from public.usuarios_empresa order by empresa_id desc limit 1), true);
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('zoomerp.owner'), true);
do $$
declare
 a uuid := current_setting('zoomerp.companyA')::uuid;
 b uuid := current_setting('zoomerp.companyB')::uuid;
 cat_a uuid; cat_b uuid; product_a uuid;
begin
 if a = b then raise exception 'Teste requer duas empresas diferentes'; end if;
 insert into public.categorias_produto(empresa_id,nome) values(a,'CATEGORIA-TESTE-ROLLBACK') returning id into cat_a;
 insert into public.categorias_produto(empresa_id,nome) values(b,'CATEGORIA-TESTE-ROLLBACK') returning id into cat_b;
 insert into public.produtos(empresa_id,categoria_id,codigo,nome,preco_venda_centavos,custo_centavos)
   values(a,cat_a,'SKU-TEST-ROLLBACK','Produto de Teste Rollback',1599,859) returning id into product_a;
 if not exists(select 1 from public.produtos where id=product_a and empresa_id=a) then
   raise exception 'Falha: dono não lê próprio produto'; end if;
 begin
  insert into public.produtos(empresa_id,categoria_id,codigo,nome,preco_venda_centavos)
    values(a,cat_b,'SKU-BAD-CROSS','Produto Invalido de Teste',1200);
  raise exception 'FALHA: FK permitiu categoria cruzada';
 exception when foreign_key_violation then null; end;
 begin
   update public.produtos set empresa_id=b where id=product_a;
   raise exception 'FALHA: transferiu produto entre empresas';
 exception when insufficient_privilege then null; end;
 begin
   insert into public.produtos(empresa_id,codigo,nome,preco_venda_centavos)
    values(a,'sku-test-rollback','SKU Repetido',1222);
   raise exception 'FALHA: SKU duplicado';
 exception when unique_violation then null; end;
 perform set_config('request.jwt.claim.sub','eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',true);
 if exists(select 1 from public.produtos where id=product_a) then raise exception 'FALHA: produto vazou para não membro'; end if;
 if exists(select 1 from public.categorias_produto where id=cat_a) then raise exception 'FALHA: categoria vazou para não membro'; end if;
 begin
   insert into public.produtos(empresa_id,codigo,nome,preco_venda_centavos)
    values(a,'INTRUSO-TESTE','Intruso',100);
   raise exception 'FALHA: intruso criou produto';
 exception when insufficient_privilege then null; end;
end $$;
rollback;
