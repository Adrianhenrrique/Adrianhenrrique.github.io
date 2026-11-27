import "@/app/catalogo.css";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { salvarCategoria } from "@/lib/catalogo-actions";
import { avisosCatalogo } from "@/lib/catalogo";
import { getErpContext } from "@/lib/auth/erp-context";
import { ArrowLeft, FolderPlus, Save } from "lucide-react";

export const dynamic = "force-dynamic";
export default async function Categorias({searchParams}: {searchParams:Promise<{empresa?:string;erro?:string;aviso?:string}>}) {
  const {empresa,erro,aviso}=await searchParams;
  const ctx=await getErpContext(empresa);
  if(ctx.role!=="dono") redirect(`/estoque?empresa=${encodeURIComponent(ctx.company.id)}&erro=permissao`);
  const {data:categorias,error}=await ctx.supabase.from("categorias_produto").select("id,nome").eq("empresa_id",ctx.company.id).order("nome");
  return <AppShell title="Categorias" description="Organize seus produtos. Os nomes são exclusivos para cada empresa." companyId={ctx.company.id} companyName={ctx.company.nome} role={ctx.role}>
    <div className="catalog-width">
      <Link href={`/estoque?empresa=${encodeURIComponent(ctx.company.id)}`} className="catalog-back"><ArrowLeft size={17}/> Voltar aos produtos</Link>
      {erro && <p role="alert" className="catalog-error">{avisosCatalogo[erro]??avisosCatalogo.banco}</p>}
      {aviso && <p role="status" className="catalog-success">{avisosCatalogo[aviso]??"Categoria salva."}</p>}
      <section className="catalog-panel"><h2><FolderPlus size={21}/> Nova categoria</h2>
        <form action={salvarCategoria} className="catalog-inline-form">
          <input type="hidden" name="empresa" value={ctx.company.id}/>
          <label className="catalog-field"><span>Nome da categoria</span>
            <input name="nome" minLength={2} maxLength={80} placeholder="Ex.: Bebidas" required/>
          </label>
          <button type="submit" className="catalog-btn catalog-primary"><FolderPlus size={17}/> Adicionar</button>
        </form>
      </section>
      <section className="catalog-panel"><h2>Categorias cadastradas</h2>
        {error ? <p className="catalog-error">Não foi possível consultar as categorias.</p> :
         !categorias?.length ? <p className="catalog-muted">Você ainda não tem categorias. Comece cadastrando uma acima.</p> :
         <div className="catalog-category-list">{categorias.map(c=><form action={salvarCategoria} className="catalog-category-row" key={c.id}>
           <input type="hidden" name="empresa" value={ctx.company.id}/>
           <input type="hidden" name="categoria_id" value={c.id}/>
           <label className="catalog-field"><span>Renomear categoria</span><input name="nome" defaultValue={c.nome} minLength={2} maxLength={80} required/></label>
           <button type="submit" className="catalog-btn catalog-secondary"><Save size={17}/> Salvar</button>
         </form>)}</div>}
      </section>
      <p className="catalog-note">Categorias não são excluídas nesta versão para evitar referências perdidas.</p>
    </div>
  </AppShell>;
}
