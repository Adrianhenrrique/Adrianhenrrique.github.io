"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getErpContext } from "@/lib/auth/erp-context";
import {
  CatalogoInvalido, LIMITE_CSV_BYTES, UUID_RE, lerProdutosCsv,
  validarProduto,
} from "@/lib/catalogo";

function field(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : "";
}
function go(empresa: string, erro: string, path = "/estoque"): never {
  redirect(`${path}?empresa=${encodeURIComponent(empresa)}&erro=${encodeURIComponent(erro)}`);
}
async function dono(form: FormData) {
  const empresa = field(form, "empresa");
  if (!UUID_RE.test(empresa)) redirect("/inicio");
  const ctx = await getErpContext(empresa);
  if (ctx.company.id !== empresa || ctx.role !== "dono") go(ctx.company.id, "permissao");
  return ctx;
}
function erroBanco(code?: string | null, categoria = false) {
  if (code === "23505") return categoria ? "categoria_duplicada" : "duplicado";
  if (code === "23503") return "categoria";
  return "banco";
}

export async function salvarProduto(form: FormData): Promise<void> {
  const ctx = await dono(form);
  const empresa = ctx.company.id;
  let produto;
  try {
    produto = validarProduto({
      nome: field(form, "nome"),
      codigo: field(form, "codigo"),
      descricao: field(form, "descricao"),
      unidade: field(form, "unidade"),
      preco_venda: field(form, "preco_venda"),
      custo: field(form, "custo"),
      categoria_id: field(form, "categoria_id"),
      ativo: form.get("ativo") === "on",
    });
  } catch (error) {
    const cause = error instanceof CatalogoInvalido ? error.motivo : "dados";
    go(empresa, cause, "/produtos/novo");
  }
  const productId = field(form, "produto_id");
  if (productId && !UUID_RE.test(productId)) go(empresa, "dados");
  const payload = { ...produto };
  let id = productId;
  if (productId) {
    const { data, error } = await ctx.supabase.from("produtos")
      .update(payload).eq("empresa_id", empresa).eq("id", productId).select("id").maybeSingle();
    if (error || !data) go(empresa, erroBanco(error?.code), `/produtos/${productId}/editar`);
  } else {
    const { data, error } = await ctx.supabase.from("produtos")
      .insert({ ...payload, empresa_id: empresa }).select("id").single();
    if (error || !data) go(empresa, erroBanco(error?.code), "/produtos/novo");
    id = data.id;
  }
  revalidatePath("/estoque");
  redirect(`/estoque?empresa=${encodeURIComponent(empresa)}&aviso=${productId ? "atualizado" : "salvo"}`);
}

export async function salvarCategoria(form: FormData): Promise<void> {
  const ctx = await dono(form);
  const empresa = ctx.company.id;
  const nome = field(form, "nome").replace(/\s+/g, " ");
  const id = field(form, "categoria_id");
  if (nome.length < 2 || nome.length > 80 || (id && !UUID_RE.test(id))) go(empresa, "dados", "/categorias");
  if (id) {
    const { data, error } = await ctx.supabase.from("categorias_produto").update({nome})
      .eq("empresa_id", empresa).eq("id", id).select("id").maybeSingle();
    if (error || !data) go(empresa, erroBanco(error?.code, true), "/categorias");
  } else {
    const { error } = await ctx.supabase.from("categorias_produto").insert({empresa_id: empresa,nome});
    if (error) go(empresa, erroBanco(error.code, true), "/categorias");
  }
  revalidatePath("/categorias");
  revalidatePath("/estoque");
  redirect(`/categorias?empresa=${encodeURIComponent(empresa)}&aviso=${id ? "categoria_atualizada" : "categoria_salva"}`);
}

export async function importarProdutosCsv(form: FormData): Promise<void> {
  const ctx = await dono(form);
  const empresa = ctx.company.id;
  const file = form.get("arquivo");
  if (!(file instanceof File) || file.size === 0) go(empresa, "csv", "/produtos/importar");
  if (file.size > LIMITE_CSV_BYTES) go(empresa, "csv_tamanho", "/produtos/importar");
  let rows;
  try {
    rows = lerProdutosCsv(await file.text());
    if (!rows.length) throw new CatalogoInvalido("csv");
  } catch (error) {
    const cause = error instanceof CatalogoInvalido ? error.motivo : "csv";
    go(empresa, cause, "/produtos/importar");
  }
  const { data: categorias, error: categoriesError } = await ctx.supabase
    .from("categorias_produto").select("id,nome").eq("empresa_id", empresa).limit(500);
  if (categoriesError) go(empresa, "banco", "/produtos/importar");
  const lookup = new Map((categorias ?? []).map(c => [c.nome.trim().toLocaleLowerCase("pt-BR"), c.id]));
  const payload = [];
  for (const { categoria_nome, ...product } of rows) {
    const id = categoria_nome ? lookup.get(categoria_nome.toLocaleLowerCase("pt-BR")) : null;
    if (categoria_nome && !id) go(empresa, "categoria", "/produtos/importar");
    payload.push({ ...product, categoria_id: id, empresa_id: empresa });
  }
  // Um único INSERT PostgreSQL: um SKU duplicado interrompe o lote inteiro.
  const { error } = await ctx.supabase.from("produtos").insert(payload);
  if (error) go(empresa, erroBanco(error.code), "/produtos/importar");
  revalidatePath("/estoque");
  redirect(`/estoque?empresa=${encodeURIComponent(empresa)}&importados=${rows.length}`);
}
