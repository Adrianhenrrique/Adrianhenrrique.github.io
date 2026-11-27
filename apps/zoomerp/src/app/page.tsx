import Link from "next/link";
import { ArrowUpRight, Boxes, ChartNoAxesCombined, LockKeyhole, ShoppingBag, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

const plannedFeatures = [
  {
    title: "Vender sem complicar",
    description: "O objetivo é registrar uma venda em até três toques após montar o carrinho.",
    icon: ShoppingBag,
  },
  {
    title: "Estoque de verdade",
    description: "Entradas, saídas e histórico de ajustes, sem apagar movimentações.",
    icon: Boxes,
  },
  {
    title: "Dinheiro sob controle",
    description: "Caixa, contas a receber e visão clara dos resultados do negócio.",
    icon: Wallet,
  },
];

export default function Home() {
  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#09131d] text-white">
      <div aria-hidden="true" className="pointer-events-none absolute -top-36 right-[-10rem] -z-10 size-[34rem] rounded-full bg-emerald-500/10 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute bottom-0 left-[-18rem] -z-10 size-[40rem] rounded-full bg-sky-500/10 blur-3xl" />
      <div className="mx-auto max-w-6xl px-5 pb-24 pt-6 sm:px-8">
        <header className="flex flex-wrap items-center justify-between gap-5 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-2xl bg-emerald-400 font-black text-slate-950">Z</div>
            <span className="text-xl font-extrabold tracking-tight">Zoom<span className="text-emerald-400">ERP</span></span>
          </div>
          <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-xs font-bold uppercase tracking-wider text-emerald-300">Etapa 0.2 · Contas e empresas</span>
        </header>

        <section className="grid items-center gap-12 pb-20 pt-20 lg:grid-cols-[1.1fr_.9fr] lg:pt-28">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.23em] text-emerald-300"><span className="size-2 rounded-full bg-emerald-400" /> Para pequenos negócios</p>
            <h1 className="max-w-3xl text-5xl font-extrabold leading-[1.08] tracking-[-.06em] sm:text-6xl md:text-7xl">Seu negócio. <span className="text-emerald-400">Sob controle.</span></h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300">Registre uma venda em 3 toques. Saiba quanto você lucrou hoje.</p>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-400">Estamos construindo uma gestão simples de vendas, estoque e dinheiro para microempresas e MEIs. A fundação de contas, empresas e permissões está em desenvolvimento. O cadastro requer um projeto Supabase configurado; vendas e estoque ainda não funcionam.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg"><Link href="/cadastro">Criar conta <ArrowUpRight className="size-4" /></Link></Button>
              <Button asChild variant="outline" size="lg"><Link href="/login">Entrar</Link></Button>
              <Button asChild variant="outline" size="lg"><Link href="https://adrianhenrrique.github.io/zoomerp/" target="_blank" rel="noopener noreferrer">Conhecer o conceito <ArrowUpRight className="size-4" /></Link></Button>
              <Button asChild variant="outline" size="lg"><Link href="https://github.com/Adrianhenrrique/Adrianhenrrique.github.io/tree/main/apps/zoomerp" target="_blank" rel="noopener noreferrer">Acompanhar o código <ArrowUpRight className="size-4" /></Link></Button>
            </div>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-slate-900/60 p-5 shadow-[0_30px_100px_#02061780] backdrop-blur sm:p-7">
            <div className="flex items-center justify-between border-b border-white/10 pb-5"><strong className="text-base">Visão do produto</strong><span className="text-xs text-emerald-300">CONCEITO</span></div>
            <div className="mt-7 grid grid-cols-2 gap-3"><div className="rounded-2xl border border-white/10 bg-white/[.04] p-4"><p className="text-xs text-slate-400">Vendas hoje</p><p className="mt-4 text-2xl font-bold">R$ 1.280,00</p><p className="mt-2 text-xs text-emerald-300">Exemplo ilustrativo</p></div><div className="rounded-2xl border border-white/10 bg-white/[.04] p-4"><p className="text-xs text-slate-400">Produtos</p><p className="mt-4 text-2xl font-bold">128</p><p className="mt-2 text-xs text-sky-300">Dados fictícios</p></div></div>
            <div className="mt-4 rounded-2xl border border-white/10 bg-[#101f2b] p-5"><div className="flex items-center gap-2 text-sm font-semibold"><ChartNoAxesCombined className="size-4 text-emerald-300" /> Visão futura do painel</div><div className="mt-7 flex h-28 items-end gap-3">{[36,54,45,76,60,89,70].map((h,i)=><div key={i} className="flex-1 rounded-t-lg bg-gradient-to-t from-emerald-600 to-emerald-300/80" style={{height:`${h}%`}} />)}</div></div>
            <p className="mt-4 flex items-center gap-2 text-xs text-slate-400"><LockKeyhole className="size-4" /> Dados ilustrativos. Login e empresas na etapa 0.2.</p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3" aria-label="Recursos planejados">
          {plannedFeatures.map(({title,description,icon:Icon})=>
            <article key={title} className="rounded-3xl border border-white/10 bg-white/[.04] p-6 transition-colors hover:border-emerald-400/30"><Icon className="mb-6 size-7 text-emerald-300" /><h2 className="text-lg font-bold">{title}</h2><p className="mt-3 text-sm leading-7 text-slate-400">{description}</p></article>
          )}
        </section>
        <footer className="mt-20 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-8 text-xs text-slate-400"><span>ZoomERP · Fundação de um micro-ERP SaaS</span><span>Não emite documentos fiscais · Não é um sistema funcional ainda</span></footer>
      </div>
    </main>
  );
}
