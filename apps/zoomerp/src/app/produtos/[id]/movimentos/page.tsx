import "@/app/catalogo.css";
import Link from "next/link";
import { randomUUID } from "node:crypto";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getErpContext } from "@/lib/auth/erp-context";
import { UUID_RE } from "@/lib/catalogo";
import { errosEstoque, formatQuantidade, tiposEstoque } from "@/lib/estoque";
import { registrarMovimento } from "@/lib/estoque-actions";

export const dynamic="force-dynamic";
export default async function Movimentos({params,searchParams}:{
  params:Promise<{id:string}>;
  searchParams:Promise<{empresa?:string;erro?:string;aviso?:string;pagina?:string}>;
}) {
  const [{id},query]=await Promise.all([params,searchParams]);
  if(!UUID_RE.test(id)) notFound();
  const ctx=await getErpContext(query.empresa);
  const empresa=ctx.company.id;
  if(query.empresa && query.empresa!==empresa) notFound();
  const pagina=Math.min(9999,Math.max(1,Number.parseInt(query.pagina??"1",10)||1));
  const size=20;
  const [{data:produto,error:produtoError},{data:saldo,error:saldoError},{data:movimentos,error:histError,count}]=await Promise.all([
    ctx.supabase.from("produtos").select("id,nome,unidade,ativo").eq("empresa_id",empresa).eq("id",id).maybeSingle(),
    ctx.supabase.from("estoque_saldos").select("saldo::text").eq("empresa_id",empresa).eq("produto_id",id).maybeSingle(),
    ctx.supabase.from("estoque_movimentos").select("id,tipo,delta::text,saldo_anterior::text,saldo_posterior::text,motivo,autor_id,criado_em,estorno_de",{count:"exact"})
      .eq("empresa_id",empresa).eq("produto_id",id).order("criado_em",{ascending:false}).order("id",{ascending:false}).range((pagina-1)*size,pagina*size-1)
  ]);
  if(produtoError) throw new Error("Não foi possível consultar o produto.");
  if(!produto) notFound();
  const ids=(movimentos??[]).filter(m=>m.tipo!=="estorno").map(m=>m.id);
  const {data:estornos,error:estornoError}=ids.length ? await ctx.supabase.from("estoque_movimentos").select("estorno_de").eq("empresa_id",empresa).eq("produto_id",id).in("estorno_de",ids) : {data:[],error:null};
  const estornados=new Set((estornos??[]).map(m=>m.estorno_de));
  const erro=saldoError||histError||estornoError;
  const url=`/produtos/${id}/movimentos?empresa=${encodeURIComponent(empresa)}`;
  const hidden=()=> <><input type="hidden" name="empresa" value={empresa}/><input type="hidden" name="produto" value={id}/><input type="hidden" name="requisicao" value={randomUUID()}/></>;
  return <AppShell title="Movimentações" description={produto.nome} companyId={empresa} companyName={ctx.company.nome} role={ctx.role}>
    <div className="catalog-width">
      <Link className="catalog-back" href={`/estoque?empresa=${encodeURIComponent(empresa)}`}>← Voltar ao estoque</Link>
      {query.aviso==="salvo"&&<p className="catalog-success" role="status">Movimentação registrada.</p>}
      {query.erro&&<p className="catalog-error" role="alert">{Object.hasOwn(errosEstoque,query.erro)?errosEstoque[query.erro]:errosEstoque.banco}</p>}
      {erro&&<p className="catalog-error" role="alert">Não foi possível consultar o estoque. Atualize a página antes de movimentar.</p>}
      <section className="catalog-panel"><h2>Saldo atual</h2><strong className="text-3xl">{saldoError?"—":formatQuantidade(saldo?.saldo??"0")} {produto.unidade}</strong>
        {!produto.ativo&&<p className="catalog-note">Produto arquivado: somente estornos são permitidos.</p>}</section>
      {!erro&&ctx.role==="dono"&&produto.ativo&&<section className="catalog-panel">
        <h2>Nova movimentação</h2>
        <form action={registrarMovimento} className="catalog-form">
          {hidden()}
          <label className="catalog-field"><span>Operação</span><select name="tipo"><option value="entrada">Entrada</option><option value="saida">Saída</option><option value="ajuste">Ajuste por contagem</option></select></label>
          <label className="catalog-field"><span>Quantidade ({produto.unidade})</span><input name="quantidade" inputMode="decimal" required maxLength={19} placeholder="Ex.: 5 ou 1,250"/><small>No ajuste, informe o saldo físico total, não a diferença. Entrada e saída devem ser maiores que zero.</small></label>
          <label className="catalog-field"><span>Motivo</span><input name="motivo" required minLength={3} maxLength={300} placeholder="Ex.: compra de mercadorias"/></label>
          <button className="catalog-btn catalog-primary">Registrar movimentação</button>
        </form>
      </section>}
      <section className="catalog-panel"><h2>Histórico</h2>
        {!histError&&!movimentos?.length&&<p className="catalog-muted">Nenhuma movimentação registrada.</p>}
        <div className="catalog-category-list">{(movimentos??[]).map(m=><article key={m.id} className="catalog-panel" style={{overflowWrap:"anywhere",margin:0}}>
          <h3><strong>{tiposEstoque[m.tipo]??m.tipo} · {formatQuantidade(m.delta)} {produto.unidade}</strong></h3>
          <p className="catalog-muted">{new Date(m.criado_em).toLocaleString("pt-BR",{timeZone:"America/Sao_Paulo"})} · {formatQuantidade(m.saldo_anterior)} → {formatQuantidade(m.saldo_posterior)}</p>
          <p>{m.motivo}</p><p className="catalog-note">Responsável: {m.autor_id}</p>
          {estornados.has(m.id)&&<p className="catalog-muted">Estornado</p>}
          {!erro&&ctx.role==="dono"&&m.tipo!=="estorno"&&!estornados.has(m.id)&&<details>
            <summary className="catalog-back">Estornar movimentação</summary>
            <form action={registrarMovimento} className="catalog-form">{hidden()}
              <input type="hidden" name="tipo" value="estorno"/><input type="hidden" name="estorno" value={m.id}/>
              <label className="catalog-field"><span>Motivo do estorno</span><input name="motivo" required minLength={3} maxLength={300}/></label>
              <button className="catalog-btn catalog-secondary">Confirmar estorno</button>
            </form>
          </details>}
        </article>)}</div>
        {!histError&&<nav className="catalog-pagination" aria-label="Paginação do histórico">
          {pagina>1&&<Link className="catalog-btn catalog-secondary" href={`${url}&pagina=${pagina-1}`}>Anterior</Link>}
          <span>Página {pagina}</span>
          {pagina*size<(count??0)&&<Link className="catalog-btn catalog-secondary" href={`${url}&pagina=${pagina+1}`}>Próxima</Link>}
        </nav>}
      </section>
    </div>
  </AppShell>;
}
