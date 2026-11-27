import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ConviteForm } from "@/components/convite-form";
import { createClient } from "@/lib/supabase/server";

// Calculado no servidor, por requisição, antes de montar o JSX.
function classificarConvites<T extends {aceito_em:string|null;expira_em:string}>(convites:T[]) {
  const agora = Date.now();
  return convites.map(convite=>({...convite,status:convite.aceito_em?"Aceito":new Date(convite.expira_em).getTime()<agora?"Expirado":"Pendente"}));
}

export const dynamic = "force-dynamic";
export default async function Equipe({searchParams}: {searchParams:Promise<{empresa?:string}>}) {
  const {empresa}=await searchParams;
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) redirect("/login");
  const {data:owner}=await supabase.from("usuarios_empresa").select("empresa_id").eq("empresa_id",empresa??"").eq("usuario_id",user.id).eq("papel","dono").maybeSingle();
  if(!owner) redirect("/inicio");
  const [{data:members},{data:invites},{data:company}]=await Promise.all([
    supabase.from("usuarios_empresa").select("usuario_id,papel,created_at").eq("empresa_id",owner.empresa_id),
    supabase.from("convites_empresa").select("email,expira_em,aceito_em").eq("empresa_id",owner.empresa_id).order("created_at",{ascending:false}).limit(10),
    supabase.from("empresas").select("id,nome").eq("id",owner.empresa_id).single(),
  ]);
  if(!company) redirect("/inicio");
  const convites=classificarConvites(invites??[]);
  return (
    <AppShell title="Sua equipe" description="Gerencie quem pode trabalhar neste negócio." companyId={company.id} companyName={company.nome} role="dono">
      <div className="erp-team-wrap">
        <Link href={`/mais?empresa=${encodeURIComponent(company.id)}`} className="erp-link">← Voltar às opções</Link>
        <ConviteForm empresaId={company.id} />
        <section className="erp-card"><h2>Quem tem acesso ({members?.length??0})</h2><div className="erp-team-list">{(members??[]).map(m=><div className="erp-team-row" key={m.usuario_id}><span>Usuário {m.usuario_id.slice(0,8)}…</span><strong>{m.papel==="dono"?"Dono":"Funcionário"}</strong></div>)}</div></section>
        <section className="erp-card"><h2>Convites recentes</h2><div className="erp-team-list">{convites.map((i,n)=><div className="erp-team-row" key={n}><span className="erp-break">{i.email}</span><strong>{i.status}</strong></div>)}</div></section>
      </div>
    </AppShell>
  );
}
