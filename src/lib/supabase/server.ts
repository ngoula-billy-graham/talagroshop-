/**
 * @file server.ts
 * @description Client Supabase authentifié côté serveur, synchronisé avec les cookies HTTP.
 *
 * À utiliser :
 * - Dans les Server Components placés derrière une balise `<Suspense>`
 * - Dans les Server Actions (`src/app/actions/*`)
 * - Dans les Route Handlers (`src/app/api/*`, `src/app/auth/*`)
 */

import "server-only";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

/**
 * Crée un client Supabase attaché aux cookies de la requête courante.
 * Appelle `await connection()` en premier afin d'indiquer à Next.js 16 (Cache Components)
 * d'attendre la requête HTTP réelle avant que le SDK Supabase n'exécute `Date.now()`.
 */
export async function createClient() {
  await connection();
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Ignoré si appelé depuis un Server Component en lecture seule :
          // le rafraîchissement des cookies est déjà assuré par `src/proxy.ts`.
        }
      },
    },
  });
}
