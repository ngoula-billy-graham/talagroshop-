/**
 * @file auth.ts
 * @description Couche d'accès aux données (Data Access Layer) pour l'utilisateur connecté et les commandes.
 *
 * Sécurité :
 * - Vérifie systématiquement le jeton JWT via `supabase.auth.getClaims()`.
 * - Les requêtes SQL sont en plus protégées par les politiques Row Level Security (RLS) de PostgreSQL.
 */

import "server-only";
import { cache } from "react";
import { createClient } from "./supabase/server";
import { isSupabaseConfigured } from "./supabase/env";
import { PAYMENT_LABELS, REGIONS, type DeliveryProfile, type Order, type PaymentMethod } from "./types";

export type CurrentUser = DeliveryProfile & {
  id: string;
  email: string;
  isAdmin: boolean;
};

/**
 * Retourne l'utilisateur actuellement connecté ainsi que ses coordonnées de livraison pré-remplies
 * (issues de `public.profiles`, des métadonnées `auth.users` ou de sa dernière commande),
 * ou `null` si visiteur anonyme.
 * Mémorisé par `React.cache` pour éviter plusieurs lectures pendant le rendu d'une même page.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;

  const [{ data: profile }, { data: lastOrder }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, phone, is_admin")
      .eq("id", claims.sub)
      .maybeSingle(),
    supabase
      .from("orders")
      .select("full_name, phone, region, address, payment")
      .eq("user_id", claims.sub)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const meta = (claims.user_metadata ?? {}) as Record<string, unknown>;
  const rawRegion = String(meta.region || lastOrder?.region || "Ouest");
  const rawPayment = String(meta.payment || lastOrder?.payment || "livraison");

  return {
    id: claims.sub,
    email: String(claims.email ?? ""),
    fullName: String(profile?.full_name || meta.full_name || lastOrder?.full_name || ""),
    phone: String(profile?.phone || meta.phone || lastOrder?.phone || ""),
    region: (REGIONS as readonly string[]).includes(rawRegion) ? rawRegion : "Ouest",
    address: String(meta.address || lastOrder?.address || ""),
    payment: (rawPayment in PAYMENT_LABELS ? rawPayment : "livraison") as PaymentMethod,
    isAdmin: profile?.is_admin ?? false,
  };
});

const ORDER_COLUMNS =
  "id, number, full_name, phone, region, address, subtotal, shipping, total, payment, status, created_at, order_items(product_name, unit, unit_price, quantity)";

/**
 * Récupère les 50 dernières commandes du client connecté.
 */
export async function getMyOrders(): Promise<Order[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_COLUMNS)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data as Order[];
}

/**
 * Récupère une commande par son identifiant UUID.
 * Accessible uniquement par le client propriétaire de la commande ou un administrateur (via RLS).
 */
export async function getOrder(id: string): Promise<Order | null> {
  const user = await getCurrentUser();
  if (!user || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.from("orders").select(ORDER_COLUMNS).eq("id", id).maybeSingle();
  if (error) throw error;
  return data as Order | null;
}

/**
 * Récupère toutes les commandes récentes pour le tableau de bord `/admin`.
 * Filtrable par statut (`enregistree`, `confirmee`, `en_livraison`, `livree`, `annulee`).
 */
export async function getAllOrders(status?: string): Promise<Order[]> {
  const user = await getCurrentUser();
  if (!user?.isAdmin) return [];
  const supabase = await createClient();
  let query = supabase.from("orders").select(ORDER_COLUMNS).order("created_at", { ascending: false }).limit(100);
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw error;
  return data as Order[];
}
