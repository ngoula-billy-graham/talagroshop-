import type { Metadata } from "next";
import { SHOP_PHONE_DISPLAY } from "@/lib/types";

export const metadata: Metadata = { title: "Conditions de vente & livraison" };

export default function TermsPage() {
  return (
    <article className="wrap max-w-3xl space-y-4 py-12 leading-relaxed text-muted">
      <h1 className="font-display text-3xl font-extrabold text-brand">Conditions de vente & livraison</h1>
      <p>
        Tal Agro Shop, siège à Bafoussam (Ouest), Cameroun. Les commandes sont soumises à confirmation par téléphone
        ou WhatsApp au {SHOP_PHONE_DISPLAY}. Les prix du catalogue sont ceux affichés au moment de la commande ; la
        disponibilité, le total final et les frais de livraison sont confirmés avant expédition.
      </p>
      <p>
        Le paiement se fait à la livraison ou, après confirmation, par transfert Mobile Money externe au {SHOP_PHONE_DISPLAY}.
        Ne transmettez jamais votre code secret et n’envoyez aucun paiement avant confirmation directe de Tal Agro Shop.
      </p>
      <p>
        Les commandes peuvent être modifiées ou annulées avant leur confirmation en contactant l’entreprise. La zone desservie,
        le délai et les frais de livraison sont confirmés avec le client après l’envoi de la commande.
      </p>
      <div className="rounded-2xl border border-line bg-white p-5 text-sm text-ink">
        <h2 className="font-bold text-brand">Service client & Réclamations</h2>
        <p className="mt-1 text-muted">
          Pour toute question, modification de commande ou réclamation relative à la fraîcheur des produits à la réception,
          contactez notre service client à Bafoussam au {SHOP_PHONE_DISPLAY} (appel et WhatsApp).
        </p>
      </div>
    </article>
  );
}
