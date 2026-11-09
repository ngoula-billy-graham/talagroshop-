import Image from "next/image";
import Link from "next/link";
import { getCatalog } from "@/lib/catalog";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { ProductBrowser } from "@/components/product-browser";
import { SHOP_PHONE, SHOP_PHONE_DISPLAY } from "@/lib/types";

export default function HomePage() {
  return (
    <div className="wrap">
      <section className="grid items-center gap-8 py-8 sm:py-12 md:grid-cols-2 md:gap-10 md:py-16">
        <div>
          <span className="inline-flex rounded-full bg-[#edf3df] px-3 py-1.5 text-[11px] font-bold tracking-wider text-leaf sm:py-2 sm:text-xs">
            🌱 DU PRODUCTEUR À VOTRE TABLE
          </span>
          <h1 className="mt-4 font-display text-3xl font-extrabold leading-[1.08] tracking-tight text-brand sm:mt-5 sm:text-5xl md:text-6xl">
            Le goût du <em className="not-italic text-[#759746]">local.</em>
            <br />
            La fraîcheur en plus.
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted sm:mt-5 sm:text-base">
            Découvrez des produits agricoles et d’élevage sélectionnés auprès de producteurs camerounais.
            Des prix transparents, une origine connue, une commande simple.
          </p>
          <div className="mt-6 flex flex-col gap-2.5 sm:mt-7 sm:flex-row sm:flex-wrap sm:gap-3">
            <Link href="#catalogue" className="btn-primary w-full sm:w-auto">
              Acheter maintenant ↗
            </Link>
            <a
              href={`https://wa.me/${SHOP_PHONE}?text=${encodeURIComponent("Bonjour Tal Agro Shop, je souhaite devenir fournisseur partenaire.")}`}
              target="_blank"
              rel="noopener"
              className="btn-secondary w-full sm:w-auto"
            >
              Devenir fournisseur
            </a>
          </div>
          <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted sm:mt-6 sm:gap-5 sm:text-sm">
            <span>
              ✓ <b>Origine connue</b>
            </span>
            <span>
              ✓ <b>Prix en FCFA</b>
            </span>
            <span>
              ✓ <b>Producteurs locaux</b>
            </span>
          </div>
        </div>
        <div className="relative h-64 overflow-hidden rounded-3xl shadow-2xl sm:h-80 md:h-[420px]">
          <Image
            src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80"
            alt="Étal de fruits et légumes frais"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
          <div className="absolute bottom-3 left-3 right-3 rounded-2xl bg-white/90 p-3 text-xs backdrop-blur sm:bottom-5 sm:left-5 sm:right-auto sm:p-4 sm:text-sm">
            <b className="block text-brand">Récolté avec soin, choisi pour vous</b>
            Des filières locales, une relation directe.
          </div>
        </div>
      </section>

      <section id="catalogue" className="scroll-mt-20 py-6 sm:scroll-mt-24 sm:py-8">
        <div className="mb-5 sm:mb-6">
          <h2 className="font-display text-2xl font-extrabold text-brand sm:text-3xl">Les produits du moment</h2>
          <p className="text-sm text-muted sm:text-base">
            Disponibilités et prix mis à jour en temps réel par Tal Agro Shop.
          </p>
        </div>
        <Catalogue />
      </section>

      {/* Section Professionnels B2B & Contact local */}
      <section className="grid gap-5 py-8 sm:gap-6 sm:py-10 md:grid-cols-2">
        <div className="flex flex-col justify-between rounded-3xl bg-brand p-6 text-white shadow-xl sm:p-8">
          <div>
            <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-brand-lime">
              OFFRE PROFESSIONNELS (B2B)
            </span>
            <h3 className="mt-4 font-display text-xl font-extrabold sm:text-2xl">Vous achetez pour votre activité ?</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#cfe0cb] sm:text-base">
              Restaurants, hôtels, boulangeries et revendeurs : contactez-nous directement pour vos approvisionnements
              réguliers en gros et demi-gros depuis l’Ouest.
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-3">
            <a href={`tel:+${SHOP_PHONE}`} className="btn-secondary w-full sm:w-auto">
              📞 Appeler le {SHOP_PHONE_DISPLAY}
            </a>
            <a
              href={`https://wa.me/${SHOP_PHONE}?text=${encodeURIComponent("Bonjour Tal Agro Shop, je vous contacte pour un approvisionnement professionnel (B2B).")}`}
              target="_blank"
              rel="noopener"
              className="inline-flex w-full items-center justify-center rounded-xl bg-brand-lime px-5 py-3 text-sm font-bold text-brand transition hover:-translate-y-0.5 sm:w-auto"
            >
              Devis sur WhatsApp ↗
            </a>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-3xl border border-line bg-white p-6 shadow-sm sm:p-8">
          <div>
            <span className="inline-block rounded-full bg-cream px-3 py-1 text-xs font-bold text-leaf">
              ANCRAGE LOCAL
            </span>
            <h3 className="mt-4 font-display text-xl font-extrabold text-brand sm:text-2xl">
              Tal Agro Shop à Bafoussam
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
              Notre siège est situé à Bafoussam, au cœur du bassin agricole de la région de l’Ouest. Expédition et
              livraison organisées vers les 10 régions du Cameroun après confirmation téléphonique.
            </p>
          </div>
          <div className="mt-6">
            <a
              href={`https://wa.me/${SHOP_PHONE}`}
              target="_blank"
              rel="noopener"
              className="btn-primary w-full sm:w-auto"
            >
              💬 Écrire sur WhatsApp ↗
            </a>
          </div>
        </div>
      </section>

      {/* Section Engagements & Transparence */}
      <section className="py-8">
        <h2 className="font-display text-2xl font-extrabold text-brand">Un marché plus transparent</h2>
        <p className="mb-6 text-sm text-muted">Des repères clairs pour commander vos produits agricoles en toute confiance.</p>
        <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          {[
            { icon: "📍", title: "Origine indiquée", sub: "Région de récolte précisée" },
            { icon: "🌿", title: "Filières locales", sub: "Producteurs partenaires" },
            { icon: "📦", title: "Stocks maîtrisés", sub: "Mis à jour à chaque commande" },
            { icon: "🤝", title: "Relation directe", sub: "Du champ au marché" },
            { icon: "🧾", title: "Reçu PDF officiel", sub: "Téléchargeable immédiatement" },
          ].map((item) => (
            <div key={item.title} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-3.5 sm:p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cream text-lg sm:h-11 sm:w-11 sm:text-xl">
                {item.icon}
              </span>
              <div className="min-w-0">
                <strong className="block truncate text-sm text-ink">{item.title}</strong>
                <small className="block text-xs text-muted">{item.sub}</small>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/** Catalogue mis en cache (getCatalog → 'use cache') : fait partie de la page statique. */
async function Catalogue() {
  if (!isSupabaseConfigured) {
    return (
      <p className="rounded-2xl border border-dashed border-orange-300 bg-orange-50 p-6 text-sm text-orange-800">
        Supabase n’est pas encore configuré. Copiez <code>.env.example</code> en <code>.env.local</code>,
        renseignez l’URL et la clé anon de votre projet, puis exécutez les scripts du dossier <code>supabase/</code>.
      </p>
    );
  }
  const { categories, products } = await getCatalog();
  return <ProductBrowser categories={categories} products={products} />;
}
