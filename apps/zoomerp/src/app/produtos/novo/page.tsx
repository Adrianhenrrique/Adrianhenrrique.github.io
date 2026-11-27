import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ProdutoForm } from "@/components/produto-form";
import { avisosCatalogo } from "@/lib/catalogo";
import { getErpContext } from "@/lib/auth/erp-context";

export const dynamic = "force-dynamic";
export default async function NovoProduto({searchParams}: {searchParams: Promise<{empresa?: string; erro?:string}>}) {
  const {empresa,erro}=await searchParams;
  const ctx=await getErpContext(empresa);
  if(ctx.role!=="dono") redirect(`/estoque?empresa=${encodeURIComponent(ctx.company.id)}&erro=permissao`);
  const {data:categorias,error}=await ctx.supabase.from("categorias_produto").select("id,nome").eq("empresa_id",ctx.company.id).order("nome");
  return <AppShell title="Novo produto" description="Preencha as informações que você usará nas vendas e no controle gerencial." companyId={ctx.company.id} companyName={ctx.company.nome} role={ctx.role}>
    <div className="catalog-width">
      {error ? <p className="catalog-error">Não foi possível carregar as categorias.</p> :
        <ProdutoForm empresa={ctx.company.id} categorias={categorias??[]} erro={erro?avisosCatalogo[erro]??avisosCatalogo.banco:undefined}/>}
    </div>
  </AppShell>;
}
