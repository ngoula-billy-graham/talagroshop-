/**
 * @file proxy.ts
 * @description Proxy Next.js 16 (remplace l'ancien `middleware.ts`).
 *
 * Rôles :
 * 1. Rafraîchit automatiquement le cookie de session Supabase s'il arrive à expiration.
 * 2. Redirige les visiteurs non connectés vers `/connexion` lorsqu'ils tentent d'accéder
 *    aux routes privées (`/compte` et `/admin`).
 */

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "@/lib/supabase/env";

/** Préfixes de routes nécessitant une session active */
const PROTECTED = ["/compte", "/admin"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!isSupabaseConfigured) return response;

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
        for (const [key, value] of Object.entries(headers ?? {})) response.headers.set(key, value);
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const path = request.nextUrl.pathname;

  // Redirection vers la page de connexion si la route est protégée et l'utilisateur non authentifié
  if (!data?.claims && PROTECTED.some((p) => path === p || path.startsWith(`${p}/`))) {
    const url = request.nextUrl.clone();
    url.pathname = "/connexion";
    url.search = `?suite=${encodeURIComponent(path)}`;
    return NextResponse.redirect(url);
  }
  return response;
}

/** Exclut les fichiers statiques et images pour ne pas ralentir leur chargement */
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif)$).*)"],
};
