import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");

test("proxy atualiza sessão só em rotas protegidas, sem sobrecarga nas públicas", () => {
  const proxy = read("src/proxy.ts");
  for (const privatePath of ["inicio", "estoque", "produtos", "categorias", "equipe", "configurar", "convite"]) {
    assert.ok(proxy.includes(`"/${privatePath}/:path*"`), privatePath);
  }
  for (const publicPath of ["login", "cadastro", "offline", "manifest.webmanifest"]) {
    assert.ok(!proxy.includes(`"/${publicPath}/:path*"`), publicPath);
  }
});

test("contexto multiempresa mantém getUser/RLS e usa uma consulta de associação", () => {
  const source = read("src/lib/auth/erp-context.ts");
  assert.match(source, /auth\.getUser\(\)/);
  assert.match(source, /empresas!usuarios_empresa_empresa_id_fkey/);
  assert.equal((source.match(/\.from\(/g) ?? []).length, 1);
});

test("consultas independentes de catálogo são paralelas e não expõem custos na listagem", () => {
  const source = read("src/app/estoque/page.tsx");
  assert.match(source, /Promise\.all\(/);
  assert.doesNotMatch(source, /select\("id,nome,codigo,categoria_id,preco_venda_centavos,custo_centavos/);
  assert.match(source, /\.eq\("empresa_id",company\)/);
});

test("CSS do ERP não é descarregado no login e existe skeleton de navegação", () => {
  const root = read("src/app/layout.tsx");
  assert.doesNotMatch(root, /import "\.\/erp\.css"/);
  assert.doesNotMatch(root, /import "\.\/catalogo\.css"/);
  assert.match(read("src/components/app-shell.tsx"), /import "@\/app\/erp\.css"/);
  assert.match(read("src/app/estoque/page.tsx"), /import "@\\/app\\/catalogo\\.css"/);
  assert.match(read("src/app/loading.tsx"), /aria-busy="true"/);
});
