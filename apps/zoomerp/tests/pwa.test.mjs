import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const read = (path) => readFileSync(resolve(process.cwd(), path), "utf8");

test("manifesto PWA possui nome, escopo, início, modo standalone e ícones", () => {
  const manifest = JSON.parse(read("public/manifest.webmanifest"));
  assert.equal(manifest.lang, "pt-BR");
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.scope, "/");
  assert.equal(manifest.start_url, "/inicio");
  for (const size of ["192x192", "512x512"]) {
    const icon = manifest.icons.find((item) => item.sizes === size && item.purpose === "any");
    assert.ok(icon, `Ícone ${size} ausente`);
    assert.ok(existsSync(resolve(process.cwd(), "public", icon.src.replace(/^\//, ""))));
  }
});

test("SW não salva conteúdo de páginas privadas ou respostas de API", () => {
  const sw = read("public/sw.js");
  assert.match(sw, /request\.mode === "navigate"/);
  assert.match(sw, /fetch\(request\)\.catch/);
  assert.match(sw, /_next\/static\//);
  assert.doesNotMatch(sw, /cache\.put\(request, response\.clone\(\)\)[\s\S]*?navigate/);
  assert.doesNotMatch(sw, /\/auth\/|\/rest\/v1\/|\/api\//);
});

test("layout registra manifesto, ícones iOS e service worker", () => {
  const layout = read("src/app/layout.tsx");
  assert.match(layout, /manifest: "\/manifest.webmanifest"/);
  assert.match(layout, /appleWebApp/);
  assert.match(layout, /PwaRegister/);
  assert.match(read("src/components/pwa-register.tsx"), /serviceWorker\.register/);
});

test("cinco abas e FAB estão presentes no mobile-first", () => {
  const shell = read("src/components/app-shell.tsx");
  for (const name of ["Início", "Vender", "Estoque", "Caixa", "Mais"]) assert.ok(shell.includes(name));
  assert.match(shell, /erp-quick-button/);
  const css = read("src/app/erp.css");
  assert.match(css, /safe-area-inset-bottom/);
  assert.match(css, /@media\(min-width:900px\)/);
  assert.match(css, /grid-template-columns:repeat\(5/);
});

test("rotas de módulo e área interna usam verificação de sessão", () => {
  const context = read("src/lib/auth/erp-context.ts");
  assert.match(context, /auth\.getUser/);
  assert.match(context, /usuarios_empresa/);
  assert.match(context, /redirect\("\/login"\)/);
  for (const section of ["vender","estoque","caixa","mais"]) {
    assert.ok(existsSync(resolve(process.cwd(), `src/app/${section}/page.tsx`)));
  }
});
