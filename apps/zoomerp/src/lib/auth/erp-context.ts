import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Carrega os vínculos junto com suas empresas em uma única consulta REST.
 * Identidade permanece validada por getUser() e isolamento por RLS do Supabase.
 * Nunca aceita empresa_id do cliente sem conferir associação autenticada.
 */
export async function getErpContext(requestedCompany?: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const { data: memberships, error } = await supabase
    .from("usuarios_empresa")
    .select("empresa_id,papel,empresa:empresas!usuarios_empresa_empresa_id_fkey(id,nome,ramo,plano)")
    .eq("usuario_id", user.id);
  if (error) throw new Error("Não foi possível carregar as empresas da conta.");
  if (!memberships?.length) redirect("/configurar");

  // A associação do PostgREST pode ser tipada como lista sem tipos gerados.
  // Normalize ambos os formatos para uma empresa única, sem afrouxar RLS.
  const valid = memberships
    .map((m) => ({
      empresa_id: m.empresa_id,
      papel: m.papel,
      empresa: Array.isArray(m.empresa) ? m.empresa[0] : m.empresa,
    }))
    .filter((m) => m.empresa != null);
  if (!valid.length) redirect("/configurar");
  const selected = valid.find((m) => m.empresa_id === requestedCompany) ?? valid[0];
  const company = selected.empresa;
  if (!company) redirect("/configurar");

  return {
    supabase,
    user,
    company,
    companies: valid.map((m) => m.empresa!).filter(Boolean),
    role: selected.papel === "dono" ? "dono" as const : "funcionario" as const,
  };
}
