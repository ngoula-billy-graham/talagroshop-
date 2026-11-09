import type { Metadata } from "next";
import { SHOP_PHONE_DISPLAY } from "@/lib/types";

export const metadata: Metadata = { title: "Confidentialité" };

export default function PrivacyPage() {
  return (
    <article className="wrap max-w-3xl space-y-4 py-12 leading-relaxed text-muted">
      <h1 className="font-display text-3xl font-extrabold text-brand">Confidentialité</h1>
      <p>
        Tal Agro Shop collecte le nom, l’adresse e-mail, le téléphone, l’adresse de livraison et le détail des commandes afin
        de gérer les comptes, confirmer et livrer les commandes et fournir les reçus.
      </p>
      <p>
        Les données sont hébergées chez Supabase (base PostgreSQL). Les mots de passe ne sont jamais stockés en clair.
        Le récapitulatif de commande est partagé avec WhatsApp uniquement si vous choisissez de l’envoyer.
      </p>
      <p>
        Pour demander l’accès, la rectification ou la suppression des données de votre compte, contactez Tal Agro Shop
        au {SHOP_PHONE_DISPLAY}.
      </p>
    </article>
  );
}
