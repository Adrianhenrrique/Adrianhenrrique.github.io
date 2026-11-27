import "@/app/catalogo.css";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { getErpContext } from "@/lib/auth/erp-context";
import { grupoContato, tiposContatos, contatoErros, UFS } from "@/lib/contatos";
import { UUID_RE } from "@/lib/catalogo";
import { salvarContato } from "@/lib/contatos-actions";

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
   <div className="catalog-panel">
   {p.erro&&<p role="alert" className="catalog-error">{contatoErros[p.erro]??contatoErros.banco}</p>}
   <form action={salvarContato} className="catalog-form">
    <input type="hidden" name="empresa" value={empresa}/><input type="hidden" name="grupo" value={grupo}/>{!novo&&<input type="hidden" name="id" value={id}/>}
    <fieldset disabled={!editavel} className="catalog-grid-two">
      <label className="catalog-field"><span>Nome / Razão social *</span><input name="nome" required minLength={2} maxLength={150} defaultValue={contato?.nome??""}/></label>
      <label className="catalog-field"><span>CPF ou CNPJ numérico</span><input name="documento" inputMode="numeric" maxLength={18} defaultValue={contato?.documento??""}/><small>Opcional. Não cadastre dados desnecessários.</small></label>
      <label className="catalog-field"><span>Telefone / WhatsApp</span><input type="tel" name="telefone" maxLength={25} defaultValue={contato?.telefone??""}/></label>
      <label className="catalog-field"><span>E-mail</span><input type="email" name="email" maxLength={254} defaultValue={contato?.email??""}/></label>
      <label className="catalog-field"><span>CEP</span><input name="cep" inputMode="numeric" maxLength={9} defaultValue={contato?.cep??""}/></label>
      <label className="catalog-field"><span>Endereço, número e complemento</span><input name="endereco" maxLength={250} defaultValue={contato?.endereco??""}/></label>
      <label className="catalog-field"><span>Cidade</span><input name="cidade" maxLength={100} defaultValue={contato?.cidade??""}/></label>
      <label className="catalog-field"><span>UF</span><select name="uf" defaultValue={contato?.uf??""}><option value="">Selecione</option>{UFS.map(uf=><option key={uf}>{uf}</option>)}</select></label>
    </fieldset>
    <label className="catalog-field"><span>Observações</span><textarea name="observacoes" rows={3} maxLength={1000} defaultValue={contato?.observacoes??""} disabled={!editavel}/><small>Use apenas informações necessárias ao negócio.</small></label>
    <label className="catalog-check"><input type="checkbox" name="ativo" defaultChecked={contato?.ativo??true} disabled={!editavel}/><span><strong>Cadastro ativo</strong><small>Desmarque para arquivar. Você pode reativar depois.</small></span></label>
    <div className="catalog-form-actions">{editavel&&<button type="submit" className="catalog-btn catalog-primary"><Save size={18}/> {novo?"Cadastrar":"Salvar alterações"}</button>}<Link href={base} className="catalog-btn catalog-secondary">{editavel?"Cancelar":"Voltar"}</Link></div>
   </form></div>
 </AppShell>;
}
