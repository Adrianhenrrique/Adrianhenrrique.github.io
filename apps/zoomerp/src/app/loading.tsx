/** Loading imediato durante navegação entre páginas dinâmicas.
 * Não exibe informação da empresa até autenticação e RLS concluírem. */
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Carregando ZoomERP" className="min-h-dvh bg-[#0b1422] text-white">
      <div className="border-b border-white/10 bg-[#142337] px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-300 font-black text-slate-950">Z</span>
          <span className="text-lg font-extrabold">Zoom<span className="text-emerald-300">ERP</span></span>
          <span className="ml-auto text-xs text-slate-300">Carregando...</span>
        </div>
      </div>
      <main className="mx-auto max-w-6xl animate-pulse px-4 py-8 sm:px-8">
        <div className="h-3 w-24 rounded bg-white/15" />
        <div className="mt-4 h-9 w-48 rounded-xl bg-white/15" />
        <div className="mt-7 h-32 rounded-3xl bg-white/10 sm:h-40" />
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[0, 1, 2, 3].map((n) => <div key={n} className="h-28 rounded-2xl bg-white/10" />)}
        </div>
        <div className="mt-7 h-16 rounded-2xl bg-white/10" />
        <div className="mt-3 h-20 rounded-2xl bg-white/10" />
      </main>
      <span className="sr-only" role="status">Carregando página, aguarde.</span>
    </div>
  );
}
