import { StageRoute } from "@/components/stage-route";
export const dynamic = "force-dynamic";
export default async function Caixa({searchParams}: {searchParams: Promise<{empresa?: string}>}) {
  const {empresa}=await searchParams;
  return <StageRoute section="caixa" companyId={empresa}/>;
}
