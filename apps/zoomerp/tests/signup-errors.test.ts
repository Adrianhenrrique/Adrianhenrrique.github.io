import assert from "node:assert/strict";
import test from "node:test";
import { classificarErroCadastro, mensagemErroCadastro } from "../src/lib/auth/signup-errors.ts";

test("erro de envio de e-mail 429 retorna orientação para confirmar conta", () => {
  assert.equal(classificarErroCadastro({code:"over_email_send_rate_limit",status:429,message:"For security purposes, you can only request this after 56 seconds."}),"limite-email");
  assert.match(mensagemErroCadastro("limite-email") ?? "", /caixa de entrada|spam/i);
});
test("erro 429 genérico usa mensagem distinta", () => {
  assert.equal(classificarErroCadastro({status:429,code:"over_request_rate_limit"}),"limite-requisicoes");
});
test("endereço de e-mail rejeitado não mostra erro técnico", () => {
  assert.equal(classificarErroCadastro({code:"email_address_not_authorized"}),"email-invalido");
});
test("senha fraca pede senha melhor", () => {
  assert.equal(classificarErroCadastro({code:"weak_password"}),"senha-fraca");
});
test("conta existente sugere entrar ou confirmar", () => {
  assert.equal(classificarErroCadastro({code:"user_already_exists"}),"conta-existente");
});
test("erros inesperados não refletem texto do serviço", () => {
  assert.equal(classificarErroCadastro({message:"Internal error with sensitive details"}),"cadastro");
  assert.doesNotMatch(mensagemErroCadastro("cadastro") ?? "",/sensitive/i);
});
test("não revela mensagens para parâmetros desconhecidos", () => {
  assert.equal(mensagemErroCadastro("<script>alert(1)</script>"),null);
});
