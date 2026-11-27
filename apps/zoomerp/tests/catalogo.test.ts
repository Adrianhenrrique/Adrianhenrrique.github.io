import assert from "node:assert/strict";
import test from "node:test";
import { centavosEntrada, validarProduto, lerProdutosCsv, CatalogoInvalido, LIMITE_CSV_LINHAS } from "../src/lib/catalogo.ts";

test("conversão em centavos usa BigInt, não floats", () => {
  assert.equal(centavosEntrada("0,01"), 1);
  assert.equal(centavosEntrada("1.234,56"), 123456);
  assert.equal(centavosEntrada("12.90"), 1290);
  assert.equal(centavosEntrada("R$ 25,00"), 2500);
});
test("preços inválidos e negativos são rejeitados", () => {
  for (const price of ["-1,00", "12,999", "1e4", "abc", "1000000000"]) {
    assert.throws(() => centavosEntrada(price), CatalogoInvalido);
  }
});
test("validação de produto mantém sku opcional e categoria nula", () => {
  assert.deepEqual(validarProduto({nome:"  Café   especial ", preco_venda:"25,50",custo:"10,00",unidade:"pct"}), {
    nome:"Café especial", codigo:null, descricao:"", unidade:"pct",preco_venda_centavos:2550,custo_centavos:1000,categoria_id:null,ativo:true
  });
});
test("CSV com aspas, campos contendo delimitadores e BOM", () => {
  const csv = '\uFEFFnome;sku;categoria;preco_venda;custo;unidade;descricao\r\n"Café; especial";CF-1;Bebidas;10,50;4,20;pct;"Pacote \"\"forte\"\""\r\n';
  const parsed=lerProdutosCsv(csv);
  assert.equal(parsed.length,1);assert.equal(parsed[0].nome,"Café; especial");assert.equal(parsed[0].descricao,'Pacote "forte"');assert.equal(parsed[0].preco_venda_centavos,1050);
});
test("CSV rejeita SKU repetido, cabeçalho inesperado e arquivo acima do limite", () => {
  const head="nome;sku;categoria;preco_venda;custo;unidade;descricao";
  assert.throws(()=>lerProdutosCsv([head,"Café;X;;1;0;un;","Leite;x;;2;1;un;"].join("\n")),CatalogoInvalido);
  assert.throws(()=>lerProdutosCsv("nome;codigo\nCafe;x"),CatalogoInvalido);
  assert.throws(()=>lerProdutosCsv("z".repeat(151000)),CatalogoInvalido);
});
test("CSV não permite mais que 200 registros",()=>{
  const csv=["nome;sku;categoria;preco_venda;custo;unidade;descricao", ...Array.from({length:LIMITE_CSV_LINHAS+1},(_,i)=>`Produto ${i};SKU${i};;1;0;un;`)].join("\n");
  assert.throws(()=>lerProdutosCsv(csv),CatalogoInvalido);
});
test("CSV com vírgula aceita valores decimais entre aspas",()=>{
  const parsed=lerProdutosCsv('nome,sku,categoria,preco_venda,custo,unidade,descricao\n"Café",CF2,,"12,90","6,20",un,'); 
  assert.equal(parsed[0].preco_venda_centavos,1290);
});
