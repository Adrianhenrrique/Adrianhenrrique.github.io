import { NextResponse } from "next/server";

/** Estado técnico; não expõe dados de clientes ou informações de ambiente. */
export function GET() {
  return NextResponse.json({ status: "ok", app: "zoomerp", phase: "1.2", version: "1.2.0-rc.1" });
}
