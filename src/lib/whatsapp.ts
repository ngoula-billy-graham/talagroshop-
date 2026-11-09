/**
 * @file whatsapp.ts
 * @description Génère le lien de redirection WhatsApp contenant le récapitulatif complet d'une commande.
 */

import { PAYMENT_LABELS, SHOP_PHONE, formatFcfa, type Order } from "./types";

/**
 * Construit l'URL `https://wa.me/...` pré-remplie avec le numéro de commande,
 * les articles commandés, le total en FCFA et l'adresse de livraison du client.
 */
export function whatsappOrderUrl(order: Order) {
  const summary = order.order_items.map((l) => `• ${l.product_name} x${l.quantity}`).join("\n");
  const message =
    `Bonjour Tal Agro Shop, commande ${order.number}.\n${summary}\n` +
    `Total indicatif : ${formatFcfa(order.total)} (livraison à confirmer).\n` +
    `Paiement : ${PAYMENT_LABELS[order.payment]}.\n` +
    `Client : ${order.full_name}, ${order.phone}.\nAdresse : ${order.region} — ${order.address}`;
  return `https://wa.me/${SHOP_PHONE}?text=${encodeURIComponent(message)}`;
}
