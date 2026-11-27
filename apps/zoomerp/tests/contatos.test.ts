import test from "node:test";
import assert from "node:assert/strict";
import { validarContato, grupoContato, buscaContato, formatarTelefone, avisoContato } from "../src/lib/contatos.ts";

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

test("telefones brasileiros são formatados sem modificar números externos",()=>{assert.equal(formatarTelefone("11977776666"),"(11) 97777-6666");assert.equal(formatarTelefone("1133334444"),"(11) 3333-4444");assert.equal(formatarTelefone("5511977776666"),"+55 (11) 97777-6666");assert.equal(formatarTelefone("123456789012345"),"123456789012345");});
test("avisos distinguem arquivamento de edição e reativação",()=>{assert.equal(avisoContato(null,true),"salvo");assert.equal(avisoContato(true,false),"arquivado");assert.equal(avisoContato(false,true),"reativado");assert.equal(avisoContato(true,true),"atualizado");});
