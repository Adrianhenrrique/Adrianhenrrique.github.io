import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(path,"utf8");
test("erros da ação retornam estado em vez de redirecionar ou expor formulário na URL",()=>{
 const a=read("src/lib/contatos-actions.ts");
 assert.match(a,/return \{erro:e instanceof ContatoInvalido/);
 assert.match(a,/return \{erro:result.error\?\.code==="23505"/);
 assert.doesNotMatch(a,/redirect\([^\n]*erro=/);
 const form=read("src/components/contato-form.tsx");
 assert.match(form,/useActionState\(salvarContato/);
 assert.match(form,/value:values\[key\]/);
 assert.match(form,/onChange:/);
});
test("catálogo tem campos 16px e não cobre formulários com ação flutuante",()=>{
 assert.match(read("src/app/catalogo.css"),/font:inherit;font-size:16px/);
 const shell=read("src/components/app-shell.tsx");
 assert.match(shell,/showQuickActions &&/);
 assert.match(shell,/\["\/estoque","\/categorias","\/produtos","\/contatos"\]/);
});
