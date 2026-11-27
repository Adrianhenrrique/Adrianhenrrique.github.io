import Link from "next/link";
import { cadastrar } from "@/lib/auth/actions";
import { destinoSeguro } from "@/lib/auth/next-path";
import { AuthFrame, inputClass, primaryClass } from "@/components/auth-frame";

export default async function Cadastro({ searchParams }: { searchParams: Promise<{ erro?: string; next?: string }> }) {
  const { erro, next } = await searchParams;
  return (
    <AuthFrame title="Sua gestão começa aqui" subtitle="Crie uma conta e organize seu negócio em poucos passos.">
      {erro && <p role="alert" className="mb-5 rounded-xl border border-rose-400/40 bg-rose-500/10 p-3 text-sm text-rose-100">{erro === "dados" ? "Confira seu e-mail e use uma senha de no mínimo 8 caracteres." : "Não foi possível criar sua conta. Confira os dados ou tente novamente."}</p>}
      <form action={cadastrar} className="space-y-5">
        <input type="hidden" name="next" value={destinoSeguro(next)} />
        <label className="block text-sm font-semibold">E-mail<input className={inputClass} name="email" type="email" autoComplete="email" required maxLength={254} placeholder="voce@empresa.com" /></label>
        <label className="block text-sm font-semibold">Crie uma senha<input className={inputClass} name="senha" type="password" autoComplete="new-password" required minLength={8} maxLength={128} placeholder="Pelo menos 8 caracteres" /></label>
        <button className={primaryClass} type="submit">Criar conta grátis</button>
      </form>
      <p className="mt-5 text-sm text-slate-400">14 dias de experiência planejada. Esta versão está em desenvolvimento e ainda não realiza vendas.</p>
      <p className="mt-6 text-center text-sm text-slate-300">Já tem conta? <Link href="/login" className="font-semibold text-emerald-300 hover:underline">Entrar</Link></p>
    </AuthFrame>
  );
}
