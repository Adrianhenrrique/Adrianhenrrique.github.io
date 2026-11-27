import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sair } from "@/lib/auth/actions";

export const dynamic = "force-dynamic";
export default async function Inicio({ searchParams }: { searchParams: Promise<{ aviso?: string; erro?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: vinculos, error } = await supabase.from("usuarios_empresa").select("empresa_id,papel").eq("usuario_id", user.id);
  if (error) return <main className="mx-auto max-w-xl p-6 text-white"><h1 className="text-2xl font-bold">Banco ainda não preparado</h1><p className="mt-4">Execute a migração SQL da Etapa 0.2 no Supabase e atualize a página.</p></main>;
  if (!vinculos?.length) redirect("/configurar");
  const { data: empresas, error: companyError } = await supabase.from("empresas").select("id,nome,ramo,plano").in("id", vinculos.map(v => v.empresa_id));
  if (companyError) return <main className="p-6 text-white">Não foi possível consultar as empresas.</main>;
  const { aviso, erro } = await searchParams;
  return (
    <main className="min-h-dvh bg-[#09131d] px-4 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-7">
          <div><p className="text-sm font-bold uppercase tracking-widest text-emerald-300">ZoomERP · Etapa 0.2</p><h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">Olá, {user.email?.split("@")[0]}!</h1></div>
          <form action={sair}><button type="submit" className="min-h-12 rounded-xl border border-white/30 px-5 text-base">Sair</button></form>
        </header>
        {aviso === "convite" && <p className="mt-6 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-emerald-200" role="status">Convite aceito! A empresa está disponível.</p>}
        {erro && <p role="alert" className="mt-6 rounded-xl border border-rose-400/30 bg-rose-400/10 p-4">Não foi possível aceitar o convite. Confira se ele ainda é válido.</p>}
        <h2 className="mt-10 mb-5 text-2xl font-bold">Suas empresas</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {(empresas ?? []).map((empresa) => {
            const vinculo = vinculos.find((v) => v.empresa_id === empresa.id);
            return <article key={empresa.id} className="min-w-0 rounded-2xl border border-white/15 bg-slate-900 p-6">
              <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">{vinculo?.papel === "dono" ? "Dono" : "Funcionário"}</span>
              <h3 className="mt-5 text-xl font-bold break-words">{empresa.nome}</h3><p className="mt-2 text-sm text-slate-400">Plano {empresa.plano} · {empresa.ramo}</p>
              {vinculo?.papel === "dono" && <Link href={`/equipe?empresa=${encodeURIComponent(empresa.id)}`} className="mt-6 inline-flex min-h-12 items-center rounded-xl border border-emerald-400/40 px-5 font-semibold text-emerald-300">Gerenciar equipe →</Link>}
            </article>;
          })}
        </div>
        <Link href="/configurar" className="mt-7 inline-flex min-h-12 items-center rounded-xl border border-white/20 px-5 text-sm font-bold">+ Cadastrar outra empresa</Link>
        <div className="mt-10 rounded-2xl border border-sky-400/20 bg-sky-400/5 p-5 text-sm leading-7 text-slate-300">Seu acesso e o isolamento entre empresas estão sendo preparados. Produtos, estoque, vendas e caixa serão implementados nas próximas etapas. Nenhum documento fiscal é emitido.</div>
      </div>
    </main>
  );
}
