import { destinoSeguro } from "@/lib/auth/next-path";
import { NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const token_hash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  // EmailOTPType não garante runtime: restringimos explicitamente a tipos de confirmação.
  if (token_hash && type && ["signup", "email", "invite", "recovery"].includes(type)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    if (!error) return NextResponse.redirect(new URL(destinoSeguro(url.searchParams.get("next")), url.origin));
  }
  return NextResponse.redirect(new URL("/login?erro=confirmacao", url.origin));
}
