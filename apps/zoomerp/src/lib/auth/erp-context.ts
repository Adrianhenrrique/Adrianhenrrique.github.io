import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Nunca confia em empresa_id recebido do cliente sem conferir o vínculo via RLS. */
export async function getErpContext(requestedCompany?: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const { data: memberships, error: membershipError } = await supabase
    .from("usuarios_empresa").select("empresa_id,papel").eq("usuario_id", user.id);
  if (membershipError) throw new Error("Não foi possível carregar os vínculos da conta.");
  if (!memberships?.length) redirect("/configurar");

  const companyIds = memberships.map((m) => m.empresa_id);
  const { data: companies, error: companyError } = await supabase
    .from("empresas").select("id,nome,ramo,plano").in("id", companyIds);
  if (companyError) throw new Error("Não foi possível consultar as empresas.");
  if (!companies?.length) redirect("/configurar");

  const company = companies.find((c) => c.id === requestedCompany) ?? companies[0];
  const membership = memberships.find((m) => m.empresa_id === company.id);
  if (!membership) throw new Error("Empresa sem vínculo válido.");

  return {
    supabase,
    user,
    company,
    companies,
    role: membership.papel === "dono" ? "dono" as const : "funcionario" as const,
  };
}
