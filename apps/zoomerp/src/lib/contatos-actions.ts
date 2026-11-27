"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getErpContext } from "@/lib/auth/erp-context";
import { UUID_RE } from "@/lib/catalogo";
import { validarContato, grupoContato, tiposContatos, ContatoInvalido, avisoContato, type ContatoFormState } from "@/lib/contatos";

export async function salvarContato(_state:ContatoFormState, form:FormData):Promise<ContatoFormState> {
  const read=(key:string)=>String(form.get(key)??"");
  const grupo=grupoContato(read("grupo")), empresa=read("empresa"), id=read("id");
  if(!grupo||!UUID_RE.test(empresa)||(id&&!UUID_RE.test(id))) return {erro:"permissao"};
  const base="/contatos/"+grupo, filtro="?empresa="+encodeURIComponent(empresa);
  const ctx=await getErpContext(empresa);
  if(ctx.company.id!==empresa||ctx.role!=="dono") return {erro:"permissao"};
  let payload;
  try {
    payload=validarContato({...Object.fromEntries(form.entries()),ativo:form.get("ativo")==="on"});
  } catch(e) {
    return {erro:e instanceof ContatoInvalido?e.codigo:"banco"};
  }
  let anterior:boolean|null=null;
  if(id){
    const current=await ctx.supabase.from("contatos").select("ativo").eq("empresa_id",empresa).eq("tipo",tiposContatos[grupo]).eq("id",id).maybeSingle();
    if(current.error||!current.data) return {erro:"banco"};
    anterior=current.data.ativo;
  }
  const result=id?await ctx.supabase.from("contatos").update(payload).eq("empresa_id",empresa).eq("tipo",tiposContatos[grupo]).eq("id",id).select("id").maybeSingle():await ctx.supabase.from("contatos").insert({...payload,empresa_id:empresa,tipo:tiposContatos[grupo]}).select("id").single();
  if(result.error||!result.data) return {erro:result.error?.code==="23505"?"duplicado":"banco"};
  revalidatePath(base);
  redirect(base+filtro+(payload.ativo?"":"&status=arquivados")+"&aviso="+avisoContato(anterior,payload.ativo));
}
