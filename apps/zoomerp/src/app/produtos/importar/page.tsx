import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { importarProdutosCsv } from "@/lib/catalogo-actions";
import { avisosCatalogo } from "@/lib/catalogo";
import { getErpContext } from "@/lib/auth/erp-context";
import { ArrowLeft, Download, FileUp, Info } from "lucide-react";

export const dynamic = "force-dynamic";
export default async function ImportarProdutos({searchParams}: {searchParams:Promise<{empresa?:string;erro?:string}>}) {
  const {empresa,erro}=await searchParams;
  const ctx=await getErpContext(empresa);
  if(ctx.role!=="dono") redirect(`/estoque?empresa=${encodeURIComponent(ctx.company.id)}&erro=permissao`);
  return <AppShell title="Importar produtos" description="Cadastre vários produtos de uma vez usando uma planilha CSV." companyId={ctx.company.id} companyName={ctx.company.nome} role={ctx.role}>
    <div className="catalog-width">
      <Link className="catalog-back" href={`/estoque?empresa=${encodeURIComponent(ctx.company.id)}`}><ArrowLeft size={17}/> Voltar aos produtos</Link>
      <section className="catalog-panel">
        <h2><FileUp size={22}/> Importar arquivo CSV</h2>
        <p className="catalog-muted">O arquivo deve ter até 150 KB e no máximo 200 linhas de produtos. Use preços no formato <strong>12,90</strong>.</p>
        {erro && <p role="alert" className="catalog-error">{avisosCatalogo[erro]??avisosCatalogo.csv}</p>}
        <a download="modelo-produtos-zoomerp.csv" className="catalog-btn catalog-secondary catalog-download" href="/modelos/produtos.csv"><Download size={18}/> Baixar modelo CSV</a>
        <form action={importarProdutosCsv} className="catalog-form catalog-import-form">
          <input name="empresa" type="hidden" value={ctx.company.id}/>
          <label className="catalog-field"><span>Selecione seu arquivo</span>
            <input name="arquivo" type="file" accept=".csv,text/csv,text/plain" required/>
          </label>
          <button type="submit" className="catalog-btn catalog-primary"><FileUp size={18}/> Importar produtos</button>
        </form>
      </section>
      <section className="catalog-panel"><h2><Info size={20}/> Como preparar</h2>
        <ol className="catalog-steps">
          <li>Baixe o modelo e preencha as colunas na mesma ordem.</li>
          <li>Se informar uma categoria, cadastre-a primeiro em <Link href={`/categorias?empresa=${encodeURIComponent(ctx.company.id)}`}>Categorias</Link>.</li>
          <li>Não repita SKUs no arquivo. Produtos com SKU já existente no banco também bloqueiam a importação.</li>
          <li>A importação é atômica: se uma linha estiver inválida, nenhum produto do arquivo é cadastrado.</li>
        </ol>
        <p className="catalog-note">Cabeçalho obrigatório: <code>nome;sku;categoria;preco_venda;custo;unidade;descricao</code></p>
      </section>
    </div>
  </AppShell>;
}
