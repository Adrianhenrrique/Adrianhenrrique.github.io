import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ProdutoForm } from "@/components/produto-form";
import { avisosCatalogo, UUID_RE } from "@/lib/catalogo";
import { getErpContext } from "@/lib/auth/erp-context";

export const dynamic = "force-dynamic";
export default async function EditarProduto({params,searchParams}: {
  params: Promise<{id:string}>; searchParams: Promise<{empresa?:string;erro?:string}>;
}) {
  const [{id},{empresa,erro}]=await Promise.all([params,searchParams]);
  if(!UUID_RE.test(id)) notFound();
  const ctx=await getErpContext(empresa);
  if(ctx.role!=="dono") redirect(`/estoque?empresa=${encodeURIComponent(ctx.company.id)}&erro=permissao`);
  const [{data:produto,error:productError},{data:categorias,error:categoryError}]=await Promise.all([
    ctx.supabase.from("produtos").select("id,nome,codigo,descricao,unidade,preco_venda_centavos,custo_centavos,categoria_id,ativo").eq("id",id).eq("empresa_id",ctx.company.id).maybeSingle(),
    ctx.supabase.from("categorias_produto").select("id,nome").eq("empresa_id",ctx.company.id).order("nome")
  ]);
  if(productError||!produto) notFound();
  return <AppShell title="Editar produto" description="Atualize preços, categoria, código ou arquive este produto." companyId={ctx.company.id} companyName={ctx.company.nome} role={ctx.role}>
    <div className="catalog-width">
      {categoryError ? <p className="catalog-error">Não foi possível carregar as categorias.</p> :
        <ProdutoForm empresa={ctx.company.id} categorias={categorias??[]} produto={produto} erro={erro?avisosCatalogo[erro]??avisosCatalogo.banco:undefined}/>}
    </div>
  </AppShell>;
}
