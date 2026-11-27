import "@/app/catalogo.css";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { getErpContext } from "@/lib/auth/erp-context";
import { grupoContato, tiposContatos } from "@/lib/contatos";
import { UUID_RE } from "@/lib/catalogo";
import { ContatoForm } from "@/components/contato-form";

export const dynamic="force-dynamic";
export default async function EditarContato({params,searchParams}:{params:Promise<{grupo:string,id:string}>,searchParams:Promise<{empresa?:string,erro?:string}>}){
 const {grupo:raw,id}=await params, grupo=grupoContato(raw);
 if(!grupo||id!=="novo"&&!UUID_RE.test(id)) notFound();
 const p=await searchParams, ctx=await getErpContext(p.empresa), empresa=ctx.company.id, novo=id==="novo", editavel=ctx.role==="dono", base="/contatos/"+grupo+"?empresa="+encodeURIComponent(empresa);
 if(p.empresa&&p.empresa!==empresa) redirect("/inicio");
 if(novo&&!editavel) redirect(base);
 const {data:contato,error}=novo?{data:null,error:null}:await ctx.supabase.from("contatos").select("id,nome,documento,telefone,email,cep,endereco,cidade,uf,observacoes,ativo").eq("empresa_id",empresa).eq("tipo",tiposContatos[grupo]).eq("id",id).maybeSingle();
 const singular=grupo==="clientes"?"cliente":"fornecedor";
 if(error) throw new Error("Não foi possível consultar o contato.");
 if(!novo&&!contato) notFound();
 return <AppShell title={(novo?"Novo ":editavel?"Editar ":"Consultar ")+singular} description="Dados básicos de relacionamento comercial." companyId={empresa} companyName={ctx.company.nome} role={ctx.role}>
   <Link className="catalog-back" href={base}><ArrowLeft size={17}/> Voltar à lista</Link>
   <ContatoForm key={empresa+":"+grupo+":"+id} empresa={empresa} grupo={grupo} id={novo?"":id} contato={contato} editavel={editavel} base={base}/>
 </AppShell>;
}
