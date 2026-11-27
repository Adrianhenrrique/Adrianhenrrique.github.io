import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { aceitarConvite } from "@/lib/auth/actions";
import { AuthFrame, primaryClass } from "@/components/auth-frame";

export const dynamic = "force-dynamic";
export default async function Convite({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ erro?: string }> }) {
  const { token } = await params;
  if (!/^[0-9a-f]{64}$/.test(token)) redirect("/inicio?erro=convite");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/convite/${token}`)}`);
  const { erro } = await searchParams;
  return <AuthFrame title="Você recebeu um convite" subtitle="Aceite para acessar uma empresa no ZoomERP como funcionário.">
    {erro && <p role="alert" className="mb-5 rounded-xl border border-rose-400/40 p-4 text-sm text-rose-200">O convite não pôde ser aceito. Ele pode ter expirado ou pertencer a outro e-mail.</p>}
    <p className="mb-5 text-sm leading-6 text-slate-300">Conta conectada: <strong className="break-all text-white">{user.email}</strong>. O convite só funciona com o e-mail confirmado de quem foi convidado.</p>
    <form action={aceitarConvite}><input type="hidden" name="token" value={token} /><button type="submit" className={primaryClass}>Aceitar convite</button></form>
    <Link href="/inicio" className="mt-6 inline-block text-sm text-slate-300 underline-offset-4 hover:underline">Não aceitar e voltar</Link>
  </AuthFrame>;
}
