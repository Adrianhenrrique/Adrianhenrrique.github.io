"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getErpContext } from "@/lib/auth/erp-context";
import { UUID_RE } from "@/lib/catalogo";
import { validarContato, grupoContato, tiposContatos, ContatoInvalido } from "@/lib/contatos";

export async function salvarContato(form:FormData) {
  const read=(key:string)=>String(form.get(key)??"");
  const grupo=grupoContato(read("grupo")), empresa=read("empresa"), id=read("id");
  if(!grupo||!UUID_RE.test(empresa)||(id&&!UUID_RE.test(id))) redirect("/inicio");
  const base="/contatos/"+grupo, filtro="?empresa="+encodeURIComponent(empresa);
  const voltar=base+"/"+(id||"novo")+filtro;
  const ctx=await getErpContext(empresa);
  if(ctx.company.id!==empresa||ctx.role!=="dono") redirect("/inicio");
  let payload;
  try {
    payload=validarContato({...Object.fromEntries(form.entries()),ativo:form.get("ativo")==="on"});
  } catch(e) {
    redirect(voltar+"&erro="+(e instanceof ContatoInvalido?e.codigo:"banco"));
  }
  const result=id?await ctx.supabase.from("contatos").update(payload).eq("empresa_id",empresa).eq("tipo",tiposContatos[grupo]).eq("id",id).select("id").maybeSingle():await ctx.supabase.from("contatos").insert({...payload,empresa_id:empresa,tipo:tiposContatos[grupo]}).select("id").single();
  if(result.error||!result.data) redirect(voltar+"&erro="+(result.error?.code==="23505"?"duplicado":"banco"));
  revalidatePath(base);
  redirect(base+filtro+"&aviso="+(id?"atualizado":"salvo"));
}
