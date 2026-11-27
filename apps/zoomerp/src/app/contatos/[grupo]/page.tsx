import "@/app/catalogo.css";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Users, Truck, Plus, Search, Pencil, ArrowRight } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { getErpContext } from "@/lib/auth/erp-context";
import { grupoContato, tiposContatos, buscaContato, formatarTelefone, contatoAvisos } from "@/lib/contatos";
import { formatarDocumento } from "@/lib/documento";

export const dynamic="force-dynamic";
export default async function Contatos({params,searchParams}:{params:Promise<{grupo:string}>,searchParams:Promise<{empresa?:string,q?:string,status?:string,pagina?:string,aviso?:string}>}){
  const grupo=grupoContato((await params).grupo);
  if(!grupo) notFound();
  const p=await searchParams, ctx=await getErpContext(p.empresa), empresa=ctx.company.id;
  const cliente=grupo==="clientes", title=cliente?"Clientes":"Fornecedores", singular=cliente?"cliente":"fornecedor", Icon=cliente?Users:Truck, base="/contatos/"+grupo;
  if(p.empresa&&p.empresa!==empresa) redirect("/inicio");
  const {q,texto,digitos,email}=buscaContato(typeof p.q==="string"?p.q:"");
  const status=p.status==="todos"||p.status==="arquivados"?p.status:"ativos";
  const pagina=Math.max(1,Math.min(9999,Number.parseInt(typeof p.pagina==="string"?p.pagina:"1",10)||1)), limit=20;
  const url=(overrides:Record<string,string|number>={})=>base+"?"+new URLSearchParams({empresa,q,status,...Object.fromEntries(Object.entries(overrides).map(([k,v])=>[k,String(v)]))}).toString();
  let query=ctx.supabase.from("contatos").select("id,nome,documento,telefone,email,cidade,uf,ativo",{count:"exact"}).eq("empresa_id",empresa).eq("tipo",tiposContatos[grupo]);
  if(status!=="todos") query=query.eq("ativo",status==="ativos");
  const filtros=[texto?"nome.ilike.%"+texto+"%":"",texto?"cidade.ilike.%"+texto+"%":"",email?"email.ilike.%"+email+"%":"",digitos?"documento.ilike.%"+digitos+"%":"",digitos?"telefone.ilike.%"+digitos+"%":""].filter(Boolean);
  if(filtros.length) query=query.or(filtros.join(","));
  const [{data:contatos,error,count},{count:ativos,error:countError}]=await Promise.all([
    query.order("nome").order("id").range((pagina-1)*limit,pagina*limit-1),
    ctx.supabase.from("contatos").select("id",{count:"exact",head:true}).eq("empresa_id",empresa).eq("tipo",tiposContatos[grupo]).eq("ativo",true),
  ]);
  const paginas=Math.max(1,Math.ceil((count??0)/limit));
  return <AppShell title={title} description={cliente?"Organize quem compra de você.":"Organize quem fornece para seu negócio."} companyId={empresa} companyName={ctx.company.nome} role={ctx.role}>
    {typeof p.aviso==="string"&&Object.hasOwn(contatoAvisos,p.aviso)?<div className="catalog-success" role="status">{contatoAvisos[p.aviso]}</div>:null}
    <section className="catalog-hero">
      <div className="catalog-hero-icon"><Icon size={28}/></div>
      <div><span>CADASTROS DO NEGÓCIO</span><h2>{title} em um só lugar</h2><p>Consulte os contatos e mantenha seus dados organizados.</p></div>
      {ctx.role==="dono"&&<Link className="catalog-btn catalog-primary" href={base+"/novo?empresa="+encodeURIComponent(empresa)}><Plus size={18}/> Novo {singular}</Link>}
    </section>
    <div className="catalog-toolbar-actions"><Link className="catalog-btn catalog-secondary" href={"/contatos/clientes?empresa="+encodeURIComponent(empresa)} aria-current={cliente?"page":undefined}><Users size={17}/> Clientes</Link><Link className="catalog-btn catalog-secondary" href={"/contatos/fornecedores?empresa="+encodeURIComponent(empresa)} aria-current={!cliente?"page":undefined}><Truck size={17}/> Fornecedores</Link></div>
    <div className="catalog-kpis"><div><span>Ativos</span><strong>{countError?"—":ativos??0}</strong></div><div><span>Resultados</span><strong>{error?"—":count??0}</strong></div></div>
    <form method="get" action={base} className="catalog-filters">
      <input type="hidden" name="empresa" value={empresa}/>
      <label className="catalog-field"><span>Buscar por nome, documento, telefone, e-mail ou cidade</span><span className="catalog-input-icon"><Search size={18}/><input type="search" name="q" maxLength={80} defaultValue={q}/></span></label>
      <label className="catalog-field"><span>Situação</span><select name="status" defaultValue={status}><option value="ativos">Ativos</option><option value="arquivados">Arquivados</option><option value="todos">Todos</option></select></label>
      <button type="submit" className="catalog-btn catalog-primary">Filtrar</button>
    </form>
    <div className="catalog-list-heading"><h2>{title} cadastrados</h2><span>{count??0} resultado(s)</span></div>
    {error?<p role="alert" className="catalog-error">Não foi possível carregar os cadastros.</p>:!contatos?.length?<div className="catalog-empty"><Icon size={32}/><h3>Nenhum cadastro encontrado</h3><p>{q||status!=="ativos"?"Altere os filtros da busca.":"Cadastre seu primeiro "+singular+"."}</p></div>:
    <div className="catalog-products">{contatos.map(c=><article className="catalog-product" key={c.id}><div className="catalog-product-icon"><Icon size={22}/></div><div className="catalog-product-meta"><h3>{c.nome}</h3><p>{c.documento?formatarDocumento(c.documento):"Sem documento"}{c.telefone?" · "+formatarTelefone(c.telefone):""}</p>{c.email&&<p>{c.email}</p>}<p>{[c.cidade,c.uf].filter(Boolean).join(" / ")}</p><span className={c.ativo?"catalog-chip":"catalog-chip archived"}>{c.ativo?"Ativo":"Arquivado"}</span></div><Link className="catalog-edit" href={base+"/"+c.id+"?empresa="+encodeURIComponent(empresa)}><Pencil size={17}/> {ctx.role==="dono"?"Editar":"Consultar"}</Link></article>)}</div>}
    {paginas>1&&!error&&<nav className="catalog-pagination" aria-label="Paginação">{pagina>1&&<Link className="catalog-btn catalog-secondary" href={url({pagina:pagina-1})}>Anterior</Link>}<span>Página {pagina} de {paginas}</span>{pagina<paginas&&<Link className="catalog-btn catalog-secondary" href={url({pagina:pagina+1})}>Próxima <ArrowRight size={16}/></Link>}</nav>}
    <p className="catalog-footnote">Cadastros não geram vendas, compras, contas a receber ou a pagar nesta etapa.</p>
  </AppShell>;
}
