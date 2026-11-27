import { AppShell } from "@/components/app-shell";
import { FeaturePending } from "@/components/feature-pending";
import { getErpContext } from "@/lib/auth/erp-context";

const names = {
  vender: ["Vender", "Venda rápida, feita para o seu celular."],
  estoque: ["Estoque", "Tenha controle do que entra e do que sai."],
  caixa: ["Caixa", "Entenda para onde vai o dinheiro do negócio."],
} as const;

export async function StageRoute({ section, companyId }: {
  section: keyof typeof names;
  companyId?: string;
}) {
  const ctx = await getErpContext(companyId);
  return (
    <AppShell companyId={ctx.company.id} companyName={ctx.company.nome} role={ctx.role} title={names[section][0]} description={names[section][1]}>
      <FeaturePending section={section} companyId={ctx.company.id} />
    </AppShell>
  );
}
