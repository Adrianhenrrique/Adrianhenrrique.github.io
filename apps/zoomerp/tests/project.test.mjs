import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const here = process.cwd();
const read = (path) => readFileSync(resolve(here, path), "utf8");

test("estrutura mínima do App Router foi criada", () => {
  for (const path of [
    "src/app/page.tsx", "src/app/layout.tsx", "src/app/globals.css",
    "src/app/health/route.ts", "src/components/ui/button.tsx",
    "components.json", "tsconfig.json", "next.config.ts",
    "README.md", "CHANGELOG.md", ".env.example",
  ]) {
    assert.ok(existsSync(resolve(here, path)), `Faltou ${path}`);
  }
});

test("Next.js, Tailwind, Supabase, TypeScript e lint têm configuração", () => {
  const pkg = JSON.parse(read("package.json"));
  for (const dep of ["next", "react", "@supabase/ssr", "@supabase/supabase-js", "zod"]) {
    assert.ok(pkg.dependencies[dep], `Dependência ${dep} ausente`);
  }
  for (const dep of ["typescript", "tailwindcss", "eslint", "prettier"]) {
    assert.ok(pkg.devDependencies[dep], `Ferramenta ${dep} ausente`);
  }
  assert.match(read("src/app/globals.css"), /@import "tailwindcss"/);
  assert.match(read("components.json"), /shadcn/);
});

test("não há credenciais no modelo de ambiente", () => {
  const env = read(".env.example");
  assert.match(env, /NEXT_PUBLIC_SUPABASE_URL=/);
  assert.match(env, /NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=/);
  assert.doesNotMatch(env, /(?:sk_live_|sb_secret_|eyJ[A-Za-z0-9_-]{25,})/);
  assert.ok(!existsSync(resolve(here, ".env.local")));
  assert.match(read(".gitignore"), /\.env\*/);
});
