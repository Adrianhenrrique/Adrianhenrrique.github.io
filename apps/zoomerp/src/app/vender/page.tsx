import { StageRoute } from "@/components/stage-route";
export const dynamic = "force-dynamic";
export default async function Vender({searchParams}: {searchParams: Promise<{empresa?: string}>}) {
  const {empresa}=await searchParams;
  return <StageRoute section="vender" companyId={empresa}/>;
}
