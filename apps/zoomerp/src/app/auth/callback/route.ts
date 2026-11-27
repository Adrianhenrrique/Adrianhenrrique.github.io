import { destinoSeguro } from "@/lib/auth/next-path";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(destinoSeguro(url.searchParams.get("next")), url.origin));
  }
  return NextResponse.redirect(new URL("/login?erro=confirmacao", url.origin));
}
