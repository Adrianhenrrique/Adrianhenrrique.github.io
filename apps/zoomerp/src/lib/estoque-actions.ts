"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getErpContext } from "@/lib/auth/erp-context";
import { UUID_RE } from "@/lib/catalogo";
import { quantidadeEstoque, errosEstoque } from "@/lib/estoque";

export async function registrarMovimento(form: FormData): Promise<void> {
  const field = (key:string) => String(form.get(key) ?? "").trim();
  const empresa=field("empresa"), produto=field("produto"), requisicao=field("requisicao");
  if (!UUID_RE.test(empresa) || !UUID_RE.test(produto)) redirect("/estoque");
  const path = `/produtos/${produto}/movimentos`;
  const url = `${path}?empresa=${encodeURIComponent(empresa)}`;
  const fail = (code:string):never => redirect(`${url}&erro=${encodeURIComponent(code)}`);
  const ctx=await getErpContext(empresa);
  if (ctx.company.id!==empresa || ctx.role!=="dono") fail("permissao");
  const tipo=field("tipo"), motivo=field("motivo"), estorno=field("estorno");
  if (!UUID_RE.test(requisicao) || !["entrada","saida","ajuste","estorno"].includes(tipo)
      || motivo.length<3 || motivo.length>300 || (tipo==="estorno" ? !UUID_RE.test(estorno) : !!estorno)) fail("dados");
  let quantidade:string|null=null;
  if(tipo!=="estorno") {
    try { quantidade=quantidadeEstoque(field("quantidade"),tipo); }
    catch { fail("quantidade"); }
  }
  const {error}=await ctx.supabase.rpc("registrar_estoque",{
    p_empresa:empresa,p_produto:produto,p_tipo:tipo,p_quantidade:quantidade,
    p_motivo:motivo,p_requisicao:requisicao,p_estorno:estorno||null
  });
  if(error) fail(Object.hasOwn(errosEstoque,error.message)?error.message:"banco");
  revalidatePath("/estoque");
  revalidatePath(path);
  redirect(`${url}&aviso=salvo`);
}
