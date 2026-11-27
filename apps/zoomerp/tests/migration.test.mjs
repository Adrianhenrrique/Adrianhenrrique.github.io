import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const sql = readFileSync("supabase/migrations/202611270001_auth_multiempresa.sql", "utf8");

test("migração habilita RLS nas três tabelas da fundação", () => {
  for (const table of ["empresas", "usuarios_empresa", "convites_empresa"]) {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`, "i"));
  }
});

test("sem escrita direta; somente RPC transacional com auth.uid", () => {
  assert.match(sql, /revoke all on public\.empresas, public\.usuarios_empresa, public\.convites_empresa from anon, authenticated/i);
  assert.match(sql, /grant select on public\.empresas, public\.usuarios_empresa, public\.convites_empresa to authenticated/i);
  assert.doesNotMatch(sql, /create policy .* for (?:insert|update|delete)/i);
  for (const rpc of ["criar_empresa", "criar_convite_funcionario", "aceitar_convite"]) {
    assert.match(sql, new RegExp(`function public\\.${rpc}\\(`));
  }
  assert.match(sql, /sha256\(convert_to\(v_token,'UTF8'\)\)/);
  assert.match(sql, /email_confirmed_at is not null/);
});
