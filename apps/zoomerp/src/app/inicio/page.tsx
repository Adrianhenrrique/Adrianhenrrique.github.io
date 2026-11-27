import Link from "next/link";
import { ArrowUpRight, Boxes, CircleHelp, PackagePlus, ShoppingCart, Wallet } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { getErpContext } from "@/lib/auth/erp-context";

export const dynamic = "force-dynamic";
export default async function Inicio({ searchParams }: { searchParams: Promise<{empresa?: string; aviso?:string; erro?:string}> }) {
  const {empresa, aviso, erro} = await searchParams;
  const ctx = await getErpContext(empresa);
  const links = [
    {label:"Nova venda",description:"Venda em poucos toques",path:"/vender",icon:ShoppingCart},
    {label:"Produtos",description:"Cadastre e consulte seus itens",path:"/estoque",icon:PackagePlus},
    {label:"Lançar despesa",description:"Registre uma saída",path:"/caixa",icon:Wallet},
  ];
  const money = [
    { label: "Vendas hoje", note: "Disponível após implementar o PDV" },
    { label: "Vendas do mês", note: "Disponível após implementar o PDV" },
    { label: "Lucro estimado", note: "Requer vendas e custo dos produtos" },
    { label: "Saldo em caixa", note: "Requer os lançamentos financeiros" },
  ];
  return (
    <AppShell title="Visão geral" description="Tudo pronto para acompanhar seu negócio quando os módulos forem liberados." companyId={ctx.company.id} companyName={ctx.company.nome} role={ctx.role}>
      {aviso === "convite" && <p className="erp-notice" role="status">Convite aceito! A empresa já está disponível.</p>}
      {erro && <p className="erp-notice erp-error" role="alert">Não foi possível aceitar o convite. Confira o link.</p>}
      {ctx.companies.length > 1 && <section aria-label="Escolher empresa" className="erp-company-chooser"><p>Trocar de empresa</p><div>{ctx.companies.map((c)=><Link key={c.id} className={ctx.company.id===c.id?"selected":""} href={`/inicio?empresa=${encodeURIComponent(c.id)}`}>{c.nome}</Link>)}</div></section>}
      <section className="erp-welcome">
        <div><p className="erp-kicker">BEM-VINDO AO SEU ESPAÇO</p><h2>Bom ter você aqui!</h2><p>Empresa <strong>{ctx.company.nome}</strong> cadastrada. Estamos preparando ferramentas para facilitar seu dia a dia.</p></div>
        <span className="erp-welcome-symbol" aria-hidden="true">Z</span>
      </section>
      <div className="erp-section-title"><h2>Seu negócio em números</h2><span>Assim que os módulos estiverem prontos</span></div>
      <section className="erp-stats" aria-label="Indicadores ainda indisponíveis">
        {money.map((m)=><article className="erp-stat" key={m.label}><p>{m.label}</p><strong aria-label="Ainda sem dados">—</strong><span>{m.note}</span></article>)}
      </section>
      <div className="erp-section-title"><h2>Atalhos rápidos</h2><span>Recursos atuais e próximos módulos</span></div>
      <section className="erp-actions" aria-label="Ações planejadas">
        {links.map(({label,description,path,icon:Icon})=><Link className="erp-action-card" key={path} href={`${path}?empresa=${encodeURIComponent(ctx.company.id)}`}><span className="erp-icon-frame"><Icon size={23}/></span><strong>{label}</strong><small>{description}</small><ArrowUpRight className="erp-action-arrow" size={19}/></Link>)}
      </section>
      <section className="erp-info"><CircleHelp size={21}/><p><strong>Seu ERP está evoluindo.</strong> O catálogo, os saldos de estoque, os lançamentos auditáveis e os cadastros de clientes e fornecedores estão disponíveis. Vendas e caixa serão liberados nas próximas etapas.</p></section>
      <Link className="erp-link" href="/configurar"><Boxes size={17}/> Cadastrar outra empresa</Link>
    </AppShell>
  );
}
