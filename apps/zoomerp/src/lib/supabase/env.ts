import { z } from "zod";

const supabaseEnvSchema = z.object({
  url: z.url(),
  publishableKey: z.string().min(1),
});

/** Validamos somente quando Supabase for usado; onboarding começa na etapa 0.2. */
export function getSupabaseConfig() {
  const parsed = supabaseEnvSchema.safeParse({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });

  if (!parsed.success) {
    throw new Error(
      "Supabase não configurado. Preencha NEXT_PUBLIC_SUPABASE_URL e " +
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY no .env.local.",
    );
  }
  return parsed.data;
}
