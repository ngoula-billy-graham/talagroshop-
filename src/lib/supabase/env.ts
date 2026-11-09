/**
 * @file env.ts
 * @description Centralise la lecture des variables d'environnement Supabase.
 * Compatible avec l'ancienne convention (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
 * et la nouvelle convention Supabase (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`).
 */

/** URL publique du projet Supabase (ex: https://xxxx.supabase.co) */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

/** Clé publique (anon / publishable) utilisée côté serveur et client avec Row Level Security (RLS) */
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  "";

/** Indique si les identifiants Supabase sont bien renseignés dans `.env.local` */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
