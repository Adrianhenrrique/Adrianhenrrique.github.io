"use client";

import { useActionState, useState } from "react";
import { gerarConvite } from "@/lib/auth/actions";

export function ConviteForm({ empresaId }: { empresaId: string }) {
  const [state, action, pending] = useActionState(gerarConvite, { url: "", erro: "" });
  const [copied, setCopied] = useState(false);
  async function copy() {
    if (!state.url || !navigator.clipboard) return;
    try { await navigator.clipboard.writeText(state.url); setCopied(true); }
    catch { setCopied(false); }
  }
  return <section className="erp-team-form">
    <h2>Convidar funcionário</h2>
    <p>Crie um convite para um e-mail específico. Você poderá enviar o link pelo WhatsApp ou por e-mail.</p>
    <form action={action} className="mt-4">
      <input type="hidden" name="empresa_id" value={empresaId} />
      <label>E-mail do funcionário <input className="erp-input" type="email" name="email" maxLength={254} required autoComplete="email" placeholder="funcionario@exemplo.com" /></label>
      <button type="submit" disabled={pending} className="erp-invite-submit">{pending ? "Gerando link…" : "Gerar link de convite"}</button>
    </form>
    {state.erro && <p role="alert" className="mt-4">{state.erro}</p>}
    {state.url && <div role="status" className="erp-invite-result">
      <strong>Link válido por 7 dias</strong>
      <input aria-label="Link de convite" className="erp-input" readOnly value={state.url} onFocus={(e)=>e.currentTarget.select()}/>
      <button type="button" className="erp-action-secondary" onClick={copy}>{copied ? "Copiado!" : "Copiar link"}</button>
      <p className="mt-3">Somente o endereço convidado, após confirmar o e-mail, poderá aceitar.</p>
    </div>}
  </section>;
}
