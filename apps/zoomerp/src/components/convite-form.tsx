"use client";

import { useActionState } from "react";
import { gerarConvite } from "@/lib/auth/actions";
import { inputClass, primaryClass } from "@/components/auth-frame";

export function ConviteForm({ empresaId }: { empresaId: string }) {
  const [state, action, pending] = useActionState(gerarConvite, { url: "", erro: "" });
  return <div className="mt-5 rounded-2xl border border-white/15 bg-slate-900 p-6">
    <h2 className="text-xl font-semibold">Convidar funcionário</h2>
    <p className="mt-2 text-sm text-slate-300">Crie um link para o e-mail do funcionário. Você precisará enviar esse link manualmente por e-mail ou WhatsApp.</p>
    <form action={action} className="mt-5 space-y-4">
      <input type="hidden" name="empresa_id" value={empresaId} />
      <label className="block text-sm font-semibold">E-mail do funcionário<input className={inputClass} type="email" name="email" maxLength={254} required placeholder="funcionario@exemplo.com" /></label>
      <button type="submit" disabled={pending} className={`${primaryClass} disabled:opacity-50`}>{pending ? "Gerando link…" : "Gerar link de convite"}</button>
    </form>
    {state.erro && <p role="alert" className="mt-4 rounded-xl border border-rose-400/40 p-3 text-sm text-rose-200">{state.erro}</p>}
    {state.url && <div role="status" className="mt-5 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4"><p className="mb-2 text-sm font-bold text-emerald-300">Link criado (válido por 7 dias)</p><input className={inputClass} aria-label="Link de convite para copiar" readOnly value={state.url} onFocus={e=>e.currentTarget.select()} /><button type="button" onClick={()=>navigator.clipboard?.writeText(state.url)} className="mt-3 min-h-11 rounded-lg bg-emerald-400 px-4 font-bold text-slate-950">Copiar link</button><p className="mt-2 text-xs text-slate-300">Somente a conta com o e-mail convidado e confirmado poderá aceitá-lo.</p></div>}
  </div>;
}
