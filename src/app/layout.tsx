import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { DM_Sans, Manrope } from "next/font/google";
import { CartProvider } from "@/components/cart/cart-provider";
import { CartButton, FavoritesNavButton } from "@/components/cart/cart-buttons";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { AccountLink } from "@/components/account-link";
import { SHOP_PHONE, SHOP_PHONE_DISPLAY } from "@/lib/types";
import "./globals.css";

const sans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"] });
const display = Manrope({ variable: "--font-manrope", subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#173d2e",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://talagroshop.vercel.app"),
  title: { default: "Tal Agro Shop — Produits agricoles du Cameroun", template: "%s · Tal Agro Shop" },
  description:
    "Produits agricoles camerounais : fruits, légumes, tubercules, œufs et produits transformés. Prix en FCFA, commande en ligne, livraison depuis Bafoussam.",
  openGraph: { type: "website", locale: "fr_CM", siteName: "Tal Agro Shop" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${sans.variable} ${display.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-cream font-sans text-ink">
        <CartProvider>
          <div className="bg-brand px-3 py-1.5 text-center text-[11px] tracking-wide text-[#eaf3df] sm:py-2 sm:text-xs print:hidden">
            Tal Agro Shop · Bafoussam, Ouest · Commandes au {SHOP_PHONE_DISPLAY}
          </div>
          <header className="sticky top-0 z-40 border-b border-line bg-[#faf8f1]/95 backdrop-blur print:hidden">
            <div className="wrap flex h-14 items-center justify-between gap-2 sm:h-16 sm:gap-6">
              <Link
                href="/"
                className="shrink-0 whitespace-nowrap font-display text-lg font-extrabold tracking-tight text-brand sm:text-2xl"
              >
                Tal Agro Shop<span className="text-[#87a94c]">.</span>
              </Link>
              <nav className="ml-auto flex items-center gap-1.5 sm:gap-3">
                <Link
                  href="/#catalogue"
                  className="hidden rounded-xl px-3 py-2 text-sm font-semibold text-brand hover:bg-cream md:inline"
                >
                  Catalogue
                </Link>
                <Suspense fallback={<span className="rounded-xl px-2.5 py-1.5 text-xs text-brand sm:px-3 sm:py-2 sm:text-sm">♡</span>}>
                  <FavoritesNavButton />
                </Suspense>
                <Suspense fallback={<span className="h-4 w-16 animate-pulse rounded bg-line" />}>
                  <AccountLink />
                </Suspense>
                <CartButton />
              </nav>
            </div>
          </header>

          <main className="flex-1">{children}</main>

          <footer className="mt-16 bg-brand py-12 text-sm text-[#cfe0cb] print:hidden">
            <div className="wrap grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="font-display text-xl font-extrabold text-white">
                  Tal Agro Shop<span className="text-brand-lime">.</span>
                </p>
                <p className="mt-2 leading-relaxed">
                  Entreprise établie à Bafoussam, Région de l’Ouest, Cameroun.
                  <br />
                  Commandes : <a href={`tel:+${SHOP_PHONE}`} className="underline hover:text-white">{SHOP_PHONE_DISPLAY}</a>
                </p>
              </div>
              <div className="space-y-1.5">
                <h4 className="font-bold text-white">Explorer</h4>
                <Link href="/#catalogue" className="block hover:text-white">Tous les produits</Link>
                <Link href="/compte" className="block hover:text-white">Mon compte & reçus</Link>
              </div>
              <div className="space-y-1.5">
                <h4 className="font-bold text-white">Informations</h4>
                <Link href="/conditions" className="block hover:text-white">Conditions de vente & livraison</Link>
                <Link href="/confidentialite" className="block hover:text-white">Politique de confidentialité</Link>
              </div>
              <div className="space-y-1.5">
                <h4 className="font-bold text-white">Besoin d’aide ?</h4>
                <a href={`https://wa.me/${SHOP_PHONE}`} target="_blank" rel="noopener" className="block hover:text-white">
                  Écrire sur WhatsApp ↗
                </a>
                <a href={`tel:+${SHOP_PHONE}`} className="block hover:text-white">{SHOP_PHONE_DISPLAY}</a>
                <p className="text-xs text-[#a5bfa0]">Bafoussam · Ouest, Cameroun</p>
              </div>
            </div>
          </footer>

          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
