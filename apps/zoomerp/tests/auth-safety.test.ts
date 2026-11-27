import assert from "node:assert/strict";
import test from "node:test";
import { destinoSeguro } from "../src/lib/auth/next-path.ts";

const token = "a".repeat(64);
test("retorno pós-login aceita apenas convite interno válido", () => {
  assert.equal(destinoSeguro(`/convite/${token}`), `/convite/${token}`);
  assert.equal(destinoSeguro("https://exemplo.com"), "/inicio");
  assert.equal(destinoSeguro("//exemplo.com"), "/inicio");
  assert.equal(destinoSeguro("/inicio?next=//evil.com"), "/inicio");
  assert.equal(destinoSeguro(`/convite/${"a".repeat(63)}`), "/inicio");
  assert.equal(destinoSeguro(undefined), "/inicio");
});
