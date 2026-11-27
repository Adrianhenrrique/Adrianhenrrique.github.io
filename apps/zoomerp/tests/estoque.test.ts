import assert from "node:assert/strict";
import test from "node:test";
import { quantidadeEstoque,formatQuantidade,validarEstoqueMinimo } from "../src/lib/estoque.ts";
test("quantidade aceita decimais brasileiros sem converter para float",()=>{
  assert.equal(quantidadeEstoque("1,250","entrada"),"1.250");
  assert.equal(quantidadeEstoque("0","ajuste"),"0");
  for(const value of ["0","-1","1e3","1.1234","NaN","Infinity","1,2,3","1000000000000000"])
    assert.throws(()=>quantidadeEstoque(value,"entrada"));
});
test("formata quantidades exatas, inclusive negativas",()=>{
  assert.equal(formatQuantidade("123456789012345.123"),"123.456.789.012.345,123");
  assert.equal(formatQuantidade("-1000.500"),"-1.000,5");
  assert.equal(formatQuantidade("0.000"),"0");
});

test("limite desativado é diferente de zero e rejeita valores inválidos",()=>{
  assert.equal(validarEstoqueMinimo("  "),null);
  assert.equal(validarEstoqueMinimo("0"),"0");
  assert.equal(validarEstoqueMinimo("1,125"),"1.125");
  for(const value of ["-1","1.1234","NaN","1e2"]) assert.throws(()=>validarEstoqueMinimo(value));
});
