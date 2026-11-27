import { NextResponse } from "next/server";

/** Somente integridade técnica; não retorna dados de clientes ou ambiente. */
export function GET() {
  return NextResponse.json({ status: "ok", app: "zoomerp", phase: "0.2" });
}
