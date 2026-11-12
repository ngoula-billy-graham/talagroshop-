/**
 * @file whatsapp.ts
 * @description Génère le lien de redirection WhatsApp universel (compatible WhatsApp standard et WhatsApp Business)
 * contenant le récapitulatif complet d'une commande pour l'administrateur de Tal Agro Shop.
 */

import { PAYMENT_LABELS, SHOP_PHONE, SHOP_PHONE_DISPLAY, formatFcfa, type Order } from "./types";

/**
 * Construit l'URL `https://wa.me/237698736635?...` pré-remplie avec :
 * - Le numéro de commande officiel
 * - Le détail complet des articles (nom, quantité, prix unitaires et sous-totaux)
 * - Le sous-total, les frais de livraison indicatifs et le total en FCFA
 * - Le mode de règlement choisi
 * - Les coordonnées complètes du client (nom, téléphone, région, ville/quartier/repères GPS)
 * - La référence du reçu PDF officiel
 *
 * Fonctionne immédiatement sur WhatsApp Messenger et WhatsApp Business,
 * même si le client n'a pas enregistré le numéro de l'administrateur dans ses contacts.
 */
export function whatsappOrderUrl(order: Order) {
  const summary = order.order_items
    .map((l) => `• ${l.product_name} x${l.quantity} (${formatFcfa(l.unit_price * l.quantity)})`)
    .join("\n");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://talagroshop.vercel.app";

  const message =
    `🌾 *NOUVELLE COMMANDE TAL AGRO SHOP*\n` +
    `*N° de commande :* ${order.number}\n\n` +
    `📦 *Articles commandés :*\n${summary}\n\n` +
    `💰 *Sous-total :* ${formatFcfa(order.subtotal)}\n` +
    `🚚 *Livraison (indicative) :* ${formatFcfa(order.shipping)}\n` +
    `💵 *TOTAL :* ${formatFcfa(order.total)}\n` +
    `💳 *Paiement :* ${PAYMENT_LABELS[order.payment]}\n\n` +
    `👤 *Client :* ${order.full_name}\n` +
    `📞 *Téléphone :* ${order.phone}\n` +
    `📍 *Adresse de livraison :* ${order.region} — ${order.address}\n\n` +
    `📄 _Reçu officiel : Recu-${order.number}.pdf_\n` +
    `🌐 _Consulter sur : ${siteUrl}_`;

  return `https://wa.me/${SHOP_PHONE}?text=${encodeURIComponent(message)}`;
}
