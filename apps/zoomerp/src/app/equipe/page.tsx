import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ConviteForm } from "@/components/convite-form";

export const dynamic = "force-dynamic";
export default async function Equipe({ searchParams }: { searchParams: Promise<{ empresa?: string }> }) {
  const { empresa } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: dono } = await supabase.from("usuarios_empresa").select("empresa_id").eq("usuario_id", user.id).eq("papel", "dono").eq("empresa_id", empresa ?? "").maybeSingle();
  if (!dono) redirect("/inicio");
  const [{ data: vinculos }, { data: convites }, { data: company }] = await Promise.all([
    supabase.from("usuarios_empresa").select("usuario_id,papel,created_at").eq("empresa_id", dono.empresa_id),
    supabase.from("convites_empresa").select("email,expira_em,aceito_em").eq("empresa_id", dono.empresa_id).order("created_at",{ascending:false}).limit(15),
    supabase.from("empresas").select("nome").eq("id", dono.empresa_id).single(),
  ]);
  return <main className="min-h-dvh bg-[#09131d] px-4 py-8 text-white sm:px-8"><div className="mx-auto max-w-2xl">
    <Link href="/inicio" className="text-sm font-semibold text-emerald-300">← Voltar ao início</Link>
    <h1 className="mt-6 text-3xl font-bold">Equipe de {company?.nome}</h1><p className="mt-3 text-slate-300">Somente o dono pode gerenciar convites. Funcionários não têm acesso a relatórios financeiros ou configurações.</p>
    <ConviteForm empresaId={dono.empresa_id} />
    <section className="mt-8 rounded-2xl border border-white/15 bg-slate-900 p-5"><h2 className="text-xl font-semibold">Pessoas com acesso ({vinculos?.length ?? 0})</h2><ul className="mt-3 divide-y divide-white/10">{(vinculos??[]).map((v) => <li className="flex flex-wrap justify-between gap-3 py-3 text-sm" key={v.usuario_id}><span className="break-all text-slate-300">Usuário {v.usuario_id.slice(0,8)}…</span><strong className="text-emerald-300">{v.papel === "dono" ? "Dono" : "Funcionário"}</strong></li>)}</ul></section>
    <section className="mt-5 rounded-2xl border border-white/15 bg-slate-900 p-5"><h2 className="text-xl font-semibold">Últimos convites</h2><ul className="mt-3 divide-y divide-white/10">{(convites??[]).map((c,i)=><li className="flex flex-wrap justify-between gap-2 py-3 text-sm" key={`${c.email}-${i}`}><span className="break-all">{c.email}</span><span className="text-slate-400">{c.aceito_em ? "Aceito" : new Date(c.expira_em).getTime() < Date.now() ? "Expirado" : "Pendente"}</span></li>)}</ul></section>
  </div></main>;
}
