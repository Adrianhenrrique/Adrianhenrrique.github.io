import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseConfig } from "./env";

/**
 * Cliente SSR inicial. Na etapa 0.2 haverá proxy de refresh, autorização e RLS.
 * Nunca exponha uma chave de serviço a componentes do navegador.
 */
export async function createClient() {
  const { url, publishableKey } = getSupabaseConfig();
  const cookieStore = await cookies();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Renderização RSC pode não permitir mutações de cookies.
          // O proxy de atualização de sessão será implementado na etapa 0.2.
        }
      },
    },
  });
}
