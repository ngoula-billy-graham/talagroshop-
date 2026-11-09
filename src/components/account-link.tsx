/**
 * @file account-link.tsx
 * @description Composant serveur affichant « Connexion » ou « Mon compte » (+ « Admin » si administrateur).
 * Placé derrière une balise `<Suspense>` dans `layout.tsx` afin de ne pas bloquer le rendu statique de l'en-tête.
 */

import Link from "next/link";
import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function AccountLink() {
  await connection();
  const user = await getCurrentUser();
  if (!user) {
    return (
      <Link
        href="/connexion"
        className="whitespace-nowrap rounded-xl px-2 py-1.5 text-xs font-semibold text-brand hover:bg-cream sm:px-3 sm:py-2 sm:text-sm"
      >
        Connexion
      </Link>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-xs font-semibold text-brand sm:gap-3 sm:text-sm">
      {user.isAdmin && (
        <Link href="/admin" className="whitespace-nowrap rounded-lg bg-cream px-2 py-1 hover:bg-brand-lime/50">
          Admin
        </Link>
      )}
      <Link href="/compte" className="whitespace-nowrap rounded-lg px-1.5 py-1 hover:bg-cream">
        <span className="sm:hidden">Compte</span>
        <span className="hidden sm:inline">Mon compte</span>
      </Link>
    </span>
  );
}
