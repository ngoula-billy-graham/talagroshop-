/**
 * @file actions/orders.ts
 * @description Server Actions de gestion des commandes et d'administration du catalogue.
 *
 * Sécurité & Concurrence :
 * - `placeOrder` appelle la fonction transactionnelle PostgreSQL `place_order(...)` qui vérifie
 *   les stocks et enregistre la commande de manière atomique (impossible de vendre un produit épuisé).
 * - `updateOrderStatus`, `updateProduct` et `createProduct` vérifient systématiquement que l'appelant est administrateur.
 */

"use server";

import { refresh, updateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { CATALOG_TAG } from "@/lib/catalog";
import {
  PAYMENT_LABELS, REGIONS, SHIPPING_OPTIONS,
  type Order, type OrderStatus, type PaymentMethod,
} from "@/lib/types";

export type CheckoutInput = {
  fullName?: string;
  phone: string;
  region: string;
  address: string;
  shipping: number;
  payment: PaymentMethod;
  items: { productId: string; quantity: number }[];
};

export type CheckoutResult =
  | { ok: true; order: Pick<Order, "id" | "number" | "total"> }
  | { ok: false; error: string; needsLogin?: boolean };

export type AdminActionState = { ok?: boolean; message?: string; error?: string } | undefined;

/**
 * Valide les informations de livraison et enregistre une nouvelle commande via la RPC Supabase `place_order`.
 */
export async function placeOrder(input: CheckoutInput): Promise<CheckoutResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Connectez-vous pour commander.", needsLogin: true };

  const customName = String(input.fullName ?? "").trim().slice(0, 100);
  const phone = String(input.phone ?? "").trim();
  const address = String(input.address ?? "").trim();
  if (!/^[+\d\s().-]{8,20}$/.test(phone)) return { ok: false, error: "Numéro de téléphone invalide." };
  if (!(REGIONS as readonly string[]).includes(input.region)) return { ok: false, error: "Choisissez une région." };
  if (address.length < 5) return { ok: false, error: "Précisez la ville, le quartier et un repère." };
  if (!(SHIPPING_OPTIONS as readonly number[]).includes(input.shipping)) return { ok: false, error: "Frais de livraison invalides." };
  if (!(input.payment in PAYMENT_LABELS)) return { ok: false, error: "Mode de paiement invalide." };
  const items = (input.items ?? [])
    .filter((i) => /^[0-9a-f-]{36}$/i.test(i.productId) && Number.isInteger(i.quantity) && i.quantity > 0 && i.quantity <= 500)
    .map((i) => ({ product_id: i.productId, quantity: i.quantity }));
  if (items.length < 1 || items.length > 30) return { ok: false, error: "Votre panier est vide." };

  const supabase = await createClient();

  // Sauvegarde automatique des coordonnées de livraison dans le profil du client pour ses prochaines commandes
  const nextFullName = customName || user.fullName;
  await Promise.all([
    supabase
      .from("profiles")
      .update({ full_name: nextFullName, phone })
      .eq("id", user.id),
    supabase.auth.updateUser({
      data: {
        full_name: nextFullName,
        phone,
        region: input.region,
        address,
        payment: input.payment,
      },
    }),
  ]);

  const { data, error } = await supabase
    .rpc("place_order", {
      p_phone: phone,
      p_region: input.region,
      p_address: address,
      p_shipping: input.shipping,
      p_payment: input.payment,
      p_items: items,
    })
    .single<Order>();

  if (error || !data) {
    return { ok: false, error: error?.code === "P0001" ? error.message : "La commande n’a pas pu être enregistrée. Réessayez." };
  }

  // Les stocks ayant diminué, on invalide immédiatement le cache serveur du catalogue
  updateTag(CATALOG_TAG);

  return { ok: true, order: { id: data.id, number: data.number, total: data.total } };
}

const STATUSES: OrderStatus[] = ["enregistree", "confirmee", "en_livraison", "livree", "annulee"];

/**
 * Met à jour le statut d'une commande (réservé aux administrateurs).
 */
export async function updateOrderStatus(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const user = await getCurrentUser();
  if (!user?.isAdmin) return { ok: false, error: "Accès réservé aux administrateurs." };
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as OrderStatus;
  if (!STATUSES.includes(status)) return { ok: false, error: "Statut invalide." };
  const supabase = await createClient();
  const { error } = await supabase.from("orders").update({ status }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true, message: "Statut mis à jour" };
}

/**
 * Stocke une image produit compressée (Data URL WebP) dans le bucket Supabase Storage `products`
 * s'il existe, ou conserve la Data URL WebP ultra-légère (~40 Ko) en base en secours automatique.
 */
async function storeProductImage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  slugOrId: string,
  imageData: string,
): Promise<string | null> {
  const value = imageData.trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;

  const match = value.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return null;

  const contentType = match[1];
  const buffer = Buffer.from(match[2], "base64");
  const ext = contentType.includes("webp") ? "webp" : "jpg";
  const path = `${slugOrId}-${Date.now().toString(36)}.${ext}`;

  const { error } = await supabase.storage
    .from("products")
    .upload(path, buffer, { contentType, upsert: true });

  if (!error) {
    return supabase.storage.from("products").getPublicUrl(path).data.publicUrl;
  }
  // Si le bucket Storage `products` n'a pas encore été créé, on stocke directement le WebP compressé
  return value;
}

/**
 * Met à jour le prix en FCFA, le stock disponible et/ou la photo d'un produit (réservé aux administrateurs).
 */
export async function updateProduct(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const user = await getCurrentUser();
  if (!user?.isAdmin) return { ok: false, error: "Accès réservé aux administrateurs." };
  const id = String(formData.get("id") ?? "");
  const price = Number(formData.get("price"));
  const stock = Number(formData.get("stock"));
  const rawImage = String(formData.get("image_data") ?? "").trim();

  if (!Number.isInteger(price) || price < 0 || !Number.isInteger(stock) || stock < 0) {
    return { ok: false, error: "Prix ou stock invalide." };
  }
  const supabase = await createClient();
  const patch: Record<string, unknown> = {
    price,
    stock,
    updated_at: new Date().toISOString(),
  };

  if (rawImage) {
    const resolved = await storeProductImage(supabase, id, rawImage);
    if (resolved) patch.image_url = resolved;
  }

  const { error } = await supabase.from("products").update(patch).eq("id", id);
  if (error) return { ok: false, error: error.message };
  updateTag(CATALOG_TAG);
  refresh();
  return { ok: true, message: "Enregistré" };
}

/**
 * Retire un produit du catalogue public (suppression directe ou désactivation s'il figure déjà dans des commandes).
 */
export async function deleteProduct(id: string): Promise<AdminActionState> {
  const user = await getCurrentUser();
  if (!user?.isAdmin) return { ok: false, error: "Accès réservé aux administrateurs." };
  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) {
    // Si le produit est référencé par d'anciennes commandes, on le masque du catalogue public
    const { error: hideErr } = await supabase.from("products").update({ is_active: false }).eq("id", id);
    if (hideErr) return { ok: false, error: hideErr.message };
  }
  updateTag(CATALOG_TAG);
  refresh();
  return { ok: true, message: "Produit retiré" };
}

/**
 * Crée un nouveau produit dans le catalogue depuis `/admin` (réservé aux administrateurs).
 */
export async function createProduct(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const user = await getCurrentUser();
  if (!user?.isAdmin) return { ok: false, error: "Accès réservé aux administrateurs." };

  const name = String(formData.get("name") ?? "").trim();
  const categoryId = Number(formData.get("category_id"));
  const price = Number(formData.get("price"));
  const stock = Number(formData.get("stock"));
  const unit = String(formData.get("unit") ?? "").trim();
  const origin = String(formData.get("origin") ?? "Ouest").trim();
  const tag = String(formData.get("tag") ?? "").trim() || null;
  const rawImage = String(formData.get("image_data") || formData.get("image_url") || "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!name || !categoryId || !unit || !Number.isInteger(price) || price < 0 || !Number.isInteger(stock) || stock < 0) {
    return { ok: false, error: "Veuillez remplir le nom, la catégorie, l'unité, le prix et le stock." };
  }

  const slug =
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") +
    "-" +
    Math.random().toString(36).slice(2, 6);

  const supabase = await createClient();
  const imageUrl = rawImage ? await storeProductImage(supabase, slug, rawImage) : null;

  const { error } = await supabase.from("products").insert({
    slug,
    name,
    category_id: categoryId,
    price,
    unit,
    origin,
    stock,
    tag,
    image_url: imageUrl,
    description,
    is_active: true,
  });

  if (error) return { ok: false, error: error.message };
  updateTag(CATALOG_TAG);
  refresh();
  return { ok: true, message: `Produit "${name}" ajouté au catalogue !` };
}
