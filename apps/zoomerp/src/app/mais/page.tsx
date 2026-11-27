import Link from "next/link";
import { ArrowUpRight, ShieldCheck, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { InstallPwa } from "@/components/install-pwa";
import { sair } from "@/lib/auth/actions";
import { getErpContext } from "@/lib/auth/erp-context";

export const dynamic = "force-dynamic";
export default async function Mais({ searchParams }: { searchParams: Promise<{empresa?: string}> }) {
  const { empresa } = await searchParams;
  const ctx = await getErpContext(empresa);
  return (
    <AppShell title="Mais opções" description="Seu negócio e seu aplicativo, em um só lugar." companyId={ctx.company.id} companyName={ctx.company.nome} role={ctx.role}>
      <div className="erp-more-grid">
        <InstallPwa />
        <section className="erp-card">
          <div className="erp-icon-frame"><ShieldCheck size={22}/></div>
          <h2>Seu acesso</h2>
          <p>{ctx.company.nome} · {ctx.role === "dono" ? "Dono" : "Funcionário"}</p>
          {ctx.role === "dono" && <Link className="erp-link erp-more-link" href={`/equipe?empresa=${encodeURIComponent(ctx.company.id)}`}><Users size={18}/> Gerenciar equipe <ArrowUpRight size={17}/></Link>}
          <form action={sair}><button type="submit" className="erp-action-secondary">Sair da conta</button></form>
        </section>
      </div>
      <section className="erp-card erp-disclaimer">
        <strong>ZoomERP está sendo desenvolvido.</strong>
        <p>O catálogo de produtos já funciona. Este MVP ainda não registra vendas, movimentações de estoque nem lançamentos de dinheiro. A aplicação não emite documentos fiscais.</p>
      </section>
    </AppShell>
  );
}
