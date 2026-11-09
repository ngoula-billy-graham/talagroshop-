/**
 * @file catalog.ts
 * @description Accès au catalogue public avec mise en cache serveur (`'use cache'`).
 *
 * Scalabilité (10 000+ utilisateurs) :
 * Les résultats de `getCatalog()` et `getProductBySlug()` sont mis en cache côté serveur
 * sous le tag `CATALOG_TAG`. Lorsqu'une commande est passée ou qu'un administrateur
 * modifie un prix/stock, `updateTag(CATALOG_TAG)` rafraîchit immédiatement le cache.
 */

import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "./supabase/public";
import { isSupabaseConfigured } from "./supabase/env";
import type { Category, Product } from "./types";

/** Tag de cache permettant d'invalider le catalogue après modification des stocks ou des prix */
export const CATALOG_TAG = "catalog";

/** Colonnes sélectionnées pour chaque produit, avec jointure sur sa catégorie */
const PRODUCT_COLUMNS =
  "id, slug, name, price, unit, origin, stock, tag, image_url, description, category:categories!inner(slug, name, icon)";

/**
 * Récupère toutes les catégories et tous les produits actifs du catalogue.
 */
export async function getCatalog(): Promise<{ categories: Category[]; products: Product[] }> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("minutes");

  if (!isSupabaseConfigured) return { categories: [], products: [] };
  const supabase = createPublicClient();
  const [categories, products] = await Promise.all([
    supabase.from("categories").select("id, slug, name, icon, description").order("sort_order"),
    supabase.from("products").select(PRODUCT_COLUMNS).eq("is_active", true).order("name"),
  ]);
  if (categories.error) throw categories.error;
  if (products.error) throw products.error;
  return {
    categories: categories.data,
    products: products.data as unknown as Product[],
  };
}

/**
 * Récupère le détail d'un produit à partir de son slug URL (ex: `"tomates-fraiches"`).
 */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  "use cache";
  cacheTag(CATALOG_TAG, `product:${slug}`);
  cacheLife("minutes");

  if (!isSupabaseConfigured) return null;
  const { data, error } = await createPublicClient()
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as Product | null;
}
