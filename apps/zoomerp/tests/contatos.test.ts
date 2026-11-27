import test from "node:test";
import assert from "node:assert/strict";
import { validarContato, grupoContato, buscaContato } from "../src/lib/contatos.ts";

test("normaliza campos opcionais e documento sem perder zeros",()=>{
 const contato=validarContato({nome:"  Loja  Exemplo ",documento:"529.982.247-25",telefone:"(11) 99999-9999",cep:"01234-567",email:"TESTE@exemplo.com",uf:"sp",ativo:true});
 assert.equal(contato.nome,"Loja Exemplo");assert.equal(contato.documento,"52998224725");assert.equal(contato.telefone,"11999999999");assert.equal(contato.cep,"01234567");assert.equal(contato.email,"teste@exemplo.com");assert.equal(contato.uf,"SP");
 const vazio=validarContato({nome:"Cliente",ativo:true});assert.equal(vazio.documento,null);assert.equal(vazio.email,null);
});
test("rejeita dados inválidos e documento com letras",()=>{
 for(const [campo,valor] of Object.entries({documento:"abc52998224725",telefone:"abc",cep:"123",email:"x@@y.com",uf:"XX",nome:"A"})) assert.throws(()=>validarContato({nome:"Cliente",ativo:true,[campo]:valor}));
 assert.throws(()=>validarContato({nome:"Cliente",documento:"11111111111"}));
});
test("busca não injeta filtros e aceita CPF formatado",()=>{
 assert.equal(grupoContato("clientes"),"clientes");assert.equal(grupoContato("produtos"),null);
 const b=buscaContato("529.982.247-25");assert.equal(b.digitos,"52998224725");
 assert.doesNotMatch(buscaContato("x%,id.eq.123").texto,/[%_,()]/);
});
