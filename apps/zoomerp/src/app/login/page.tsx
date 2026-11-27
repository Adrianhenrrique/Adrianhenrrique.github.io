import Link from "next/link";
import { destinoSeguro } from "@/lib/auth/next-path";
import { entrar } from "@/lib/auth/actions";
import { AuthFrame, inputClass, primaryClass } from "@/components/auth-frame";

export const dynamic = "force-dynamic";
export default async function Login({ searchParams }: { searchParams: Promise<{ erro?: string; aviso?: string; next?: string }> }) {
  const { erro, aviso, next } = await searchParams;
  return (
    <AuthFrame title="Entre no ZoomERP" subtitle="Use o e-mail e a senha da sua conta.">
      {aviso === "confirmacao" && <p role="status" className="mb-5 rounded-xl border border-emerald-400/40 bg-emerald-500/10 p-3 text-sm text-emerald-200">Confira seu e-mail para confirmar o cadastro. Depois, faça login.</p>}
      {erro && <p role="alert" className="mb-5 rounded-xl border border-rose-400/40 bg-rose-500/10 p-3 text-sm text-rose-100">{erro === "confirmacao" ? "Link inválido ou expirado. Confira seu e-mail." : erro === "nao-confirmado" ? "Sua conta ainda precisa de confirmação por e-mail. Verifique a caixa de entrada e o spam." : "Não foi possível entrar. Confira os dados e tente novamente."}</p>}
      <form action={entrar} className="space-y-5">
        <input type="hidden" name="next" value={destinoSeguro(next)} />
        <label className="block text-sm font-semibold">E-mail<input className={inputClass} name="email" type="email" autoComplete="email" required maxLength={254} placeholder="voce@empresa.com" /></label>
        <label className="block text-sm font-semibold">Senha<input className={inputClass} name="senha" type="password" autoComplete="current-password" required minLength={1} placeholder="Sua senha" /></label>
        <button className={primaryClass} type="submit">Entrar</button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-300">Não recebeu a confirmação? <Link href="/reenviar-confirmacao" className="font-semibold text-emerald-300 hover:underline">Reenviar e-mail</Link></p>
      <p className="mt-6 text-center text-sm text-slate-300">Ainda não tem conta? <Link className="font-semibold text-emerald-300 underline-offset-4 hover:underline" href={`/cadastro?next=${encodeURIComponent(destinoSeguro(next))}`}>Comece grátis</Link></p>
    </AuthFrame>
  );
}
