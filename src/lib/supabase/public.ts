/**
 * @file public.ts
 * @description Client Supabase anonyme (sans lecture de cookies).
 *
 * Pourquoi ce client existe :
 * Dans Next.js 16 (Cache Components), les fonctions marquées `'use cache'`
 * ne doivent pas lire `cookies()`. Ce client sans état permet de mettre en cache
 * le catalogue public pour tous les visiteurs simultanément.
 */

import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

/**
 * Crée un client Supabase anonyme pour les lectures publiques mises en cache.
 */
export function createPublicClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
