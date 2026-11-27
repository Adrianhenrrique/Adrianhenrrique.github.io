import "@/app/catalogo.css";
import Link from "next/link";
import { ArrowRight, Boxes, FileUp, FolderOpen, PackagePlus, Pencil, Search, SlidersHorizontal } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { getErpContext } from "@/lib/auth/erp-context";
import { UUID_RE, avisosCatalogo } from "@/lib/catalogo";
import { formatQuantidade } from "@/lib/estoque";
import { formatBRL } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function Estoque({searchParams}: {searchParams:Promise<{
  empresa?:string; q?:string; categoria?:string; status?:string; pagina?:string;
  aviso?:string; erro?:string; importados?:string; reposicao?:string;
}>}) {
  const params = await searchParams;
  const ctx = await getErpContext(params.empresa);
  const company = ctx.company.id;
  const q = (params.q ?? "").trim().replace(/[^\p{L}\p{N} _-]/gu, "").slice(0,50);
  const categoria = UUID_RE.test(params.categoria ?? "") ? params.categoria! : "";
  const status = params.status === "arquivados" ? "arquivados" : params.status === "todos" ? "todos" : "ativos";
  const pagina = Math.min(9999, Math.max(1, Number.parseInt(params.pagina ?? "1", 10) || 1));
  const limit = 20;
  const reposicao = params.reposicao==="1" ? "1" : "";

  const qs = (overrides: Record<string,string | number> = {}) => {
    const p = new URLSearchParams({empresa:company});
    const next = {q,categoria,status,reposicao,...overrides};
    for (const [key,value] of Object.entries(next)) if (String(value) && value!=="ativos") p.set(key,String(value));
    return `/estoque?${p.toString()}`;
  };
  let produtosQuery = ctx.supabase.from("estoque_catalogo")
    .select("id,nome,codigo,categoria_id,preco_venda_centavos,unidade,ativo,saldo,estoque_minimo,reposicao",{count:"exact"})
    .eq("empresa_id",company);
  if (status !== "todos") produtosQuery = produtosQuery.eq("ativo",status==="ativos");
  if (reposicao) produtosQuery = produtosQuery.eq("reposicao",true).eq("ativo",true);
  if (categoria) produtosQuery = produtosQuery.eq("categoria_id",categoria);
  if (q) produtosQuery = produtosQuery.or(`nome.ilike.%${q}%,codigo.ilike.%${q}%`);
  // Todas as consultas independentes são iniciadas juntas: menos espera serial.
  const [
    { data: categorias, error: categoriesError },
    { count: totalAtivos },
    { data: produtos, error, count },
    {count:totalReposicao,error:reposicaoError},
  ] = await Promise.all([
    ctx.supabase.from("categorias_produto").select("id,nome").eq("empresa_id",company).order("nome").limit(500),
    ctx.supabase.from("produtos").select("id",{count:"exact",head:true}).eq("empresa_id",company).eq("ativo",true),
    produtosQuery.order("created_at",{ascending:false}).order("id",{ascending:false}).range((pagina-1)*limit,pagina*limit-1),
    ctx.supabase.from("estoque_catalogo").select("id",{count:"exact",head:true}).eq("empresa_id",company).eq("ativo",true).eq("reposicao",true),
  ]);
  const categoryMap = new Map((categorias??[]).map(c=>[c.id,c.nome]));
  const pages = Math.max(1,Math.ceil((count??0)/limit));
  const imported = Number(params.importados);
  return <AppShell title="Estoque" description="Consulte seus produtos, saldos e movimentações." companyId={company} companyName={ctx.company.nome} role={ctx.role}>
    {params.aviso && avisosCatalogo[params.aviso] && <div className="catalog-success" role="status">{avisosCatalogo[params.aviso]}</div>}
    {params.erro && <div className="catalog-error" role="alert">{avisosCatalogo[params.erro]??avisosCatalogo.banco}</div>}
    {Number.isInteger(imported)&&imported>0&&imported<=200&&<div className="catalog-success" role="status">{imported} produto(s) importado(s) com sucesso.</div>}
    <section className="catalog-hero">
      <div className="catalog-hero-icon"><Boxes size={28}/></div>
      <div><span>CATÁLOGO DE PRODUTOS</span><h2>Todos os seus itens em um lugar</h2><p>Cadastre, organize e acompanhe seus produtos.</p></div>
      {ctx.role==="dono"&&<Link href={`/produtos/novo?empresa=${encodeURIComponent(company)}`} className="catalog-btn catalog-primary"><PackagePlus size={18}/> Novo produto</Link>}
    </section>
    <div className="catalog-kpis">
      <div><span>Produtos ativos</span><strong>{totalAtivos??"—"}</strong></div>
      <div><span>Reposição necessária</span><strong>{reposicaoError?"—":totalReposicao??0}</strong></div>
      <div><span>Resultados da busca</span><strong>{error?"—":count??0}</strong></div>
    </div>
    {ctx.role==="dono"&&<div className="catalog-toolbar-actions">
      <Link className="catalog-btn catalog-secondary" href={`/categorias?empresa=${encodeURIComponent(company)}`}><FolderOpen size={18}/> Categorias</Link>
      <Link className="catalog-btn catalog-secondary" href={`/produtos/importar?empresa=${encodeURIComponent(company)}`}><FileUp size={18}/> Importar CSV</Link>
    </div>}
    <form method="get" action="/estoque" className="catalog-filters">
      <input type="hidden" name="empresa" value={company}/>
      <label className="catalog-field catalog-search-field"><span>Buscar por nome ou SKU</span>
        <span className="catalog-input-icon"><Search size={18}/><input type="search" name="q" defaultValue={q} maxLength={50} placeholder="Ex.: café, CF-500..."/></span>
      </label>
      <label className="catalog-field"><span>Categoria</span>
        <select name="categoria" defaultValue={categoria} disabled={!!categoriesError}><option value="">Todas</option>{categorias?.map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}</select>
      </label>
      <label className="catalog-field"><span>Situação</span>
        <select name="status" defaultValue={status}><option value="ativos">Ativos</option><option value="arquivados">Arquivados</option><option value="todos">Todos</option></select>
      </label>
      <label className="catalog-check"><input type="checkbox" name="reposicao" value="1" defaultChecked={reposicao==="1"}/><span>Somente itens para reposição</span></label>
      <button type="submit" className="catalog-btn catalog-primary"><SlidersHorizontal size={17}/> Filtrar</button>
    </form>
    {categoriesError&&<p className="catalog-error">Não foi possível carregar as categorias.</p>}
    <div className="catalog-list-heading"><h2>Lista de produtos</h2><span>{count??0} resultado(s)</span></div>
    {error ? <p className="catalog-error">Não foi possível carregar os produtos. Tente atualizar a página.</p> :
      !produtos?.length ? <div className="catalog-empty"><Boxes size={34}/><h3>Nenhum produto encontrado</h3><p>{q||categoria||reposicao||status!=="ativos"?"Tente mudar os filtros da pesquisa.":"Seu catálogo ainda está vazio. Cadastre o primeiro produto para começar."}</p>
        {ctx.role==="dono"&&<Link href={`/produtos/novo?empresa=${encodeURIComponent(company)}`} className="catalog-btn catalog-primary"><PackagePlus size={17}/> Cadastrar produto</Link>}</div> :
      <div className="catalog-products" role="list">
        {produtos.map(p=><article className="catalog-product" role="listitem" key={p.id}>
          <div className="catalog-product-icon"><Boxes size={22}/></div>
          <div className="catalog-product-meta"><h3>{p.nome}</h3><p>{p.codigo? `SKU: ${p.codigo}` : "Sem SKU"} <span aria-hidden="true">·</span> {p.categoria_id?categoryMap.get(p.categoria_id)??"Categoria":"Sem categoria"}</p>
            <p>Saldo: {formatQuantidade(p.saldo)} {p.unidade}</p>
            {p.ativo&&p.reposicao&&<p className="catalog-stock-warning">Reposição necessária · mínimo {formatQuantidade(p.estoque_minimo??"0")} {p.unidade}</p>}
            <Link className="catalog-back" href={`/produtos/${p.id}/movimentos?empresa=${encodeURIComponent(company)}`}>Movimentações →</Link>
            <span className={p.ativo?"catalog-chip":"catalog-chip archived"}>{p.ativo?"Ativo":"Arquivado"}</span>
          </div>
          <div className="catalog-product-price"><strong>{formatBRL(p.preco_venda_centavos)}</strong><span>por {p.unidade}</span></div>
          {ctx.role==="dono"&&<Link className="catalog-edit" aria-label={`Editar ${p.nome}`} href={`/produtos/${p.id}/editar?empresa=${encodeURIComponent(company)}`}><Pencil size={17}/> Editar</Link>}
        </article>)}
      </div>}
    {pages>1&&!error&&<nav aria-label="Paginação de produtos" className="catalog-pagination">
      {pagina>1&&<Link className="catalog-btn catalog-secondary" href={qs({pagina:pagina-1})}>Anterior</Link>}
      <span>Página {pagina} de {pages}</span>
      {pagina<pages&&<Link className="catalog-btn catalog-secondary" href={qs({pagina:pagina+1})}>Próxima <ArrowRight size={16}/></Link>}
    </nav>}
    <div className="catalog-footnote">Os valores de compra e venda não representam movimentações financeiras.</div>
  </AppShell>;
}
