import assert from "node:assert/strict";
import test from "node:test";
import { documentoValido, formatarDocumento, somenteDigitos } from "../src/lib/documento.ts";

const cpf = "52998224725";
const cnpj = "11222333000181";

test("CPF com dígitos verificadores corretos", () => {
  assert.equal(documentoValido(cpf), true);
  assert.equal(documentoValido("529.982.247-25"), true);
  assert.equal(formatarDocumento(cpf), "529.982.247-25");
  assert.equal(documentoValido("52998224726"), false);
});

test("CNPJ com dígitos verificadores corretos", () => {
  assert.equal(documentoValido(cnpj), true);
  assert.equal(formatarDocumento(cnpj), "11.222.333/0001-81");
  assert.equal(documentoValido("11222333000182"), false);
});

test("documento opcional; sequências repetidas e comprimentos incorretos rejeitados", () => {
  assert.equal(documentoValido(""), true);
  assert.equal(documentoValido("111.111.111-11"), false);
  assert.equal(documentoValido("00000000000000"), false);
  assert.equal(documentoValido("12345678"), false);
  assert.equal(somenteDigitos("01.234.567/0001-89"), "01234567000189");
});
