import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { configurarEmpresa, sair } from "@/lib/auth/actions";
import { AuthFrame, inputClass, primaryClass } from "@/components/auth-frame";

export const dynamic = "force-dynamic";
export default async function Configurar({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { erro } = await searchParams;
  return (
    <AuthFrame title="Vamos conhecer seu negócio" subtitle="Passo 1 de 3 — Só o nome é obrigatório. Você pode completar o resto depois.">
      {erro && <p role="alert" className="mb-5 rounded-xl border border-rose-400/40 bg-rose-500/10 p-3 text-sm text-rose-100">{erro === "dados" ? "Confira o nome e o CPF/CNPJ informado." : "Não foi possível salvar a empresa. Confira se a migração do banco foi aplicada."}</p>}
      <form action={configurarEmpresa} className="space-y-5">
        <label className="block text-sm font-semibold">Nome do negócio <span className="text-emerald-300">*</span><input className={inputClass} name="nome" maxLength={120} minLength={2} required autoFocus placeholder="Ex.: Mercearia da Ana" /></label>
        <label className="block text-sm font-semibold">CPF ou CNPJ (opcional)<input className={inputClass} name="documento" inputMode="numeric" maxLength={30} placeholder="Somente números ou com pontuação" /></label>
        <label className="block text-sm font-semibold">Ramo da empresa<select className={inputClass} name="ramo" defaultValue="outros"><option value="outros">Outro tipo de negócio</option><option value="mercado">Mercado / mercadinho</option><option value="varejo">Loja / varejo</option><option value="oficina">Oficina</option><option value="alimentacao">Lanchonete / alimentação</option><option value="distribuidora">Distribuidora</option><option value="servicos">Prestação de serviços</option></select></label>
        <button className={primaryClass} type="submit">Salvar meu negócio</button>
      </form>
      <form action={sair} className="mt-7 text-center"><button type="submit" className="text-sm text-slate-300 underline-offset-4 hover:underline">Sair da conta</button></form>
    </AuthFrame>
  );
}
