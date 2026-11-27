"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { Save } from "lucide-react";
import { salvarContato } from "@/lib/contatos-actions";
import { contatoErros, UFS, type GrupoContato } from "@/lib/contatos";

type Campos={nome:string;documento:string|null;telefone:string|null;email:string|null;cep:string|null;endereco:string;cidade:string;uf:string|null;observacoes:string;ativo:boolean};
export function ContatoForm({empresa,grupo,id,contato,editavel,base}:{empresa:string;grupo:GrupoContato;id:string;contato:Campos|null;editavel:boolean;base:string}){
 const [state,action,pending]=useActionState(salvarContato,{erro:null});
 // Campos controlados: um erro da ação não apaga as alterações nem faz nova navegação.
 const [values,setValues]=useState({nome:contato?.nome??"",documento:contato?.documento??"",telefone:contato?.telefone??"",email:contato?.email??"",cep:contato?.cep??"",endereco:contato?.endereco??"",cidade:contato?.cidade??"",uf:contato?.uf??"",observacoes:contato?.observacoes??"",ativo:contato?.ativo??true});
 const field=(key:Exclude<keyof typeof values,"ativo">)=>({name:key,value:values[key],onChange:(e:React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>)=>setValues(v=>({...v,[key]:e.target.value}))});
 const erro=state.erro&&Object.hasOwn(contatoErros,state.erro)?contatoErros[state.erro]:state.erro?contatoErros.banco:null;
 return <div className="catalog-panel">
   <form action={action} className="catalog-form">
    <input type="hidden" name="empresa" value={empresa}/><input type="hidden" name="grupo" value={grupo}/>{id&&<input type="hidden" name="id" value={id}/>}
    {erro&&<div className="catalog-error" role="alert" id="contato-erro">{erro} Seus dados digitados foram mantidos.</div>}
    <fieldset disabled={!editavel||pending} className="catalog-grid-two contato-fields">
      <label className="catalog-field contato-status"><span>Situação do cadastro</span><select name="ativo" value={values.ativo?"on":"off"} onChange={e=>setValues(v=>({...v,ativo:e.target.value==="on"}))}><option value="on">Ativo</option><option value="off">Arquivado</option></select><small>Escolha Arquivado para retirar da lista de ativos; salve para confirmar. É possível reativar depois.</small></label>
      <label className="catalog-field"><span>Nome / Razão social *</span><input {...field("nome")} required minLength={2} maxLength={150}/></label>
      <label className="catalog-field"><span>CPF ou CNPJ numérico</span><input {...field("documento")} inputMode="numeric" maxLength={18} aria-invalid={state.erro==="documento"||state.erro==="duplicado"}/><small>Opcional. Não cadastre dados desnecessários.</small></label>
      <label className="catalog-field"><span>Telefone / WhatsApp</span><input {...field("telefone")} type="tel" maxLength={25}/></label>
      <label className="catalog-field"><span>E-mail</span><input {...field("email")} type="email" maxLength={254}/></label>
      <label className="catalog-field"><span>CEP</span><input {...field("cep")} inputMode="numeric" maxLength={9}/></label>
      <label className="catalog-field"><span>Endereço, número e complemento</span><input {...field("endereco")} maxLength={250}/></label>
      <label className="catalog-field"><span>Cidade</span><input {...field("cidade")} maxLength={100}/></label>
      <label className="catalog-field"><span>UF</span><select {...field("uf")}><option value="">Selecione</option>{UFS.map(uf=><option key={uf}>{uf}</option>)}</select></label>
      <label className="catalog-field contato-status"><span>Observações</span><textarea {...field("observacoes")} rows={3} maxLength={1000}/><small>Use apenas informações necessárias ao negócio.</small></label>
    </fieldset>
    {erro&&<p className="catalog-error" role="status">{erro}</p>}
    <div className="catalog-form-actions">{editavel&&<button type="submit" disabled={pending} className="catalog-btn catalog-primary"><Save size={18}/> {pending?"Salvando…":id?(values.ativo!==contato?.ativo?(values.ativo?"Reativar cadastro":"Arquivar cadastro"):"Salvar alterações"):"Cadastrar"}</button>}<Link href={base} className="catalog-btn catalog-secondary">{editavel?"Cancelar":"Voltar"}</Link></div>
   </form>
 </div>;
}
