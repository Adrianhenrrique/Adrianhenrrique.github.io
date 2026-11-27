import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

/** O proxy de refresh só roda nas rotas privadas.
 * Login, cadastro, página pública e ícones PWA deixam de fazer verificação remota de sessão.
 * As páginas privadas continuam a validar getUser() e aplicar RLS no servidor. */
export const config = {
  matcher: [
    "/inicio/:path*",
    "/estoque/:path*",
    "/produtos/:path*",
    "/categorias/:path*",
    "/equipe/:path*",
    "/configurar/:path*",
    "/convite/:path*",
    "/vender/:path*",
    "/caixa/:path*",
    "/mais/:path*",
  ],
};
