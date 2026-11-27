import Link from "next/link";

export function AuthFrame({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#09131d] px-4 py-12 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/90 p-6 shadow-2xl sm:p-9">
        <Link href="/" className="mb-9 inline-flex items-center gap-2 text-xl font-extrabold" aria-label="Página inicial do ZoomERP">
          <span className="grid size-11 place-items-center rounded-xl bg-emerald-400 text-slate-950">Z</span>
          Zoom<span className="-ml-2 text-emerald-300">ERP</span>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-3 mb-7 leading-relaxed text-slate-300">{subtitle}</p>
        {children}
      </div>
    </main>
  );
}

export const inputClass = "mt-2 block min-h-12 w-full rounded-xl border border-slate-500/70 bg-slate-800 px-4 text-base text-white placeholder:text-slate-400 focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-400/30";
export const primaryClass = "flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-400 px-5 py-3 text-base font-bold text-slate-950 transition hover:bg-emerald-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-200";
