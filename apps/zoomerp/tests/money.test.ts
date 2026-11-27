import assert from "node:assert/strict";
import test from "node:test";
import { assertCentavos, formatBRL, parseBRL, sumCentavos } from "../src/lib/money.ts";

test("leitura monetária em centavos com milhares e vírgula", () => {
  assert.equal(parseBRL("R$ 1.234,56"), 123456);
  assert.equal(parseBRL("0,01"), 1);
  assert.equal(parseBRL("15"), 1500);
  assert.equal(parseBRL("-10,50"), -1050);
});

test("formatação pt-BR sem arredondamentos de operações com floats", () => {
  assert.equal(formatBRL(123456).replaceAll(" ", " "), "R$ 1.234,56");
  assert.equal(formatBRL(-1).replaceAll(" ", " "), "-R$ 0,01");
  assert.equal(formatBRL(0).replaceAll(" ", " "), "R$ 0,00");
});

test("operações usam apenas inteiros e validam overflow", () => {
  assert.equal(sumCentavos(10, 30, -5), 35);
  assert.throws(() => assertCentavos(0.1), RangeError);
  assert.throws(() => sumCentavos(Number.MAX_SAFE_INTEGER, 1), RangeError);
});

test("valores malformados não são aceitos", () => {
  for (const value of ["1.23,45", "12,345", "12.34", "abc", "1,2.3", "1e5"]) {
    assert.throws(() => parseBRL(value), Error, value);
  }
});
