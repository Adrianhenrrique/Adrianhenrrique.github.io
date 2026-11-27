import Link from "next/link";
import { WifiOff } from "lucide-react";

export default function Offline() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#0b1422] px-5 text-[#eff8ff]">
      <section className="w-full max-w-sm rounded-3xl border border-white/15 bg-[#142337] p-8 text-center">
        <span className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-emerald-300/10 text-emerald-300"><WifiOff size={30}/></span>
        <h1 className="text-2xl font-extrabold">Você está sem internet</h1>
        <p className="mt-4 text-base leading-7 text-slate-300">O ZoomERP precisa de conexão para proteger e sincronizar os dados da sua empresa. Nenhuma venda ou movimentação será registrada offline.</p>
        <Link href="/inicio" className="mt-7 inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-300 px-6 text-base font-bold text-slate-950">Tentar novamente</Link>
      </section>
    </main>
  );
}
