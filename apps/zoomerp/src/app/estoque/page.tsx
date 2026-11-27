import { StageRoute } from "@/components/stage-route";
export const dynamic = "force-dynamic";
export default async function Estoque({searchParams}: {searchParams: Promise<{empresa?: string}>}) {
  const {empresa}=await searchParams;
  return <StageRoute section="estoque" companyId={empresa}/>;
}
