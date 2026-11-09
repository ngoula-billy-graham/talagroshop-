/**
 * @file types.ts
 * @description Types TypeScript partagés (entités de la base Supabase, constantes métier et formateurs).
 */

/** Catégorie de produits (ex: Maraîcher, Tubercules, Élevage) */
export type Category = {
  id: number;
  slug: string;
  name: string;
  icon: string;
  description: string;
};

/** Produit du catalogue avec sa catégorie jointe */
export type Product = {
  id: string;
  slug: string;
  name: string;
  price: number;
  unit: string;
  origin: string;
  stock: number;
  tag: string | null;
  image_url: string | null;
  description: string;
  category: Pick<Category, "slug" | "name" | "icon">;
};

/** Statuts possibles d'une commande dans la base PostgreSQL (type `order_status`) */
export type OrderStatus = "enregistree" | "confirmee" | "en_livraison" | "livree" | "annulee";

/** Modes de paiement acceptés (type `payment_method`) */
export type PaymentMethod = "livraison" | "orange_money" | "mtn_momo";

/** Coordonnées de livraison enregistrées du client pour le pré-remplissage automatique */
export type DeliveryProfile = {
  fullName: string;
  phone: string;
  region: string;
  address: string;
  payment: PaymentMethod;
};

/** Ligne d'article au sein d'une commande */
export type OrderItem = {
  product_name: string;
  unit: string;
  unit_price: number;
  quantity: number;
};

/** Commande complète avec ses articles */
export type Order = {
  id: string;
  number: string;
  full_name: string;
  phone: string;
  region: string;
  address: string;
  subtotal: number;
  shipping: number;
  total: number;
  payment: PaymentMethod;
  status: OrderStatus;
  created_at: string;
  order_items: OrderItem[];
};

/** Libellés lisibles des statuts de commande */
export const STATUS_LABELS: Record<OrderStatus, string> = {
  enregistree: "Enregistrée",
  confirmee: "Confirmée",
  en_livraison: "En livraison",
  livree: "Livrée",
  annulee: "Annulée",
};

/** Libellés lisibles des modes de paiement */
export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  livraison: "Paiement à la livraison",
  orange_money: "Orange Money (externe)",
  mtn_momo: "MTN Mobile Money (externe)",
};

/** Les 10 régions du Cameroun proposées à la livraison */
export const REGIONS = [
  "Adamaoua", "Centre", "Est", "Extrême-Nord", "Littoral",
  "Nord", "Nord-Ouest", "Ouest", "Sud", "Sud-Ouest",
] as const;

/** Paliers indicatifs de frais de livraison (en FCFA) */
export const SHIPPING_OPTIONS = [2000, 3000, 4000] as const;

/** Numéro WhatsApp / téléphone de Tal Agro Shop */
export const SHOP_PHONE = "237698736635";
export const SHOP_PHONE_DISPLAY = "+237 698 736 635";

/** Formate un montant entier en Francs CFA (ex: `1800` -> `"1 800 FCFA"`) */
export const formatFcfa = (n: number) => `${n.toLocaleString("fr-FR")} FCFA`;

/** Corrige les URLs d'images connues comme expirées sur Unsplash */
export function resolveProductImage(url: string | null): string {
  if (!url) return "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=75";
  return url.replace("photo-1596097635121-14b63b7a0c19", "photo-1596040033229-a9821ebd058d");
}
