import Link from "next/link";
import { reenviarConfirmacao } from "@/lib/auth/actions";
import { mensagemErroCadastro } from "@/lib/auth/signup-errors";
import { AuthFrame, inputClass, primaryClass } from "@/components/auth-frame";

export default async function ReenviarConfirmacao({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; aviso?: string }>;
}) {
  const { erro, aviso } = await searchParams;
  const mensagem = mensagemErroCadastro(erro);

  return (
    <AuthFrame title="Confirme seu e-mail" subtitle="Já criou sua conta? Peça um novo link de confirmação.">
      {mensagem && <p role="alert" className="mb-5 rounded-xl border border-rose-400/40 bg-rose-500/10 p-3 text-sm leading-6 text-rose-100">{mensagem}</p>}
      {aviso === "enviado" && <p role="status" className="mb-5 rounded-xl border border-emerald-400/40 bg-emerald-500/10 p-3 text-sm leading-6 text-emerald-200">Se este e-mail possui cadastro aguardando confirmação, um novo link foi solicitado. Confira a caixa de entrada e o spam.</p>}
      <form action={reenviarConfirmacao} className="space-y-5">
        <label className="block text-sm font-semibold">E-mail do cadastro
          <input className={inputClass} name="email" type="email" autoComplete="email" required maxLength={254} placeholder="voce@empresa.com" />
        </label>
        <button className={primaryClass} type="submit">Enviar link de confirmação</button>
      </form>
      <p className="mt-5 text-sm leading-6 text-slate-400">Por segurança, o provedor limita a frequência de envios. Evite apertar várias vezes.</p>
      <p className="mt-6 text-center text-sm text-slate-300"><Link href="/login" className="font-semibold text-emerald-300 hover:underline">Voltar ao login</Link></p>
    </AuthFrame>
  );
}
