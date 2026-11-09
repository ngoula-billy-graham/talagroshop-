/**
 * @file cart-buttons.tsx
 * @description Boutons interactifs liés au panier et aux favoris :
 * - `AddToCartButton` : ajoute au panier ou affiche le sélecteur de quantité `− N +` si déjà présent.
 * - `FavoriteButton` : bouton cœur `♥ / ♡` sur chaque produit.
 * - `FavoritesNavButton` : bouton `♡ Favoris` dans l'en-tête.
 * - `CartButton` : bouton d'ouverture du panier latéral dans l'en-tête.
 */

"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCart } from "./cart-provider";
import type { Product } from "@/lib/types";

/**
 * Bouton « Ajouter au panier + » affiché sur chaque carte produit et sur la fiche détaillée.
 * Si l'article est déjà dans le panier, affiche directement un sélecteur `− Qté +`.
 */
export function AddToCartButton({ product, className = "" }: { product: Product; className?: string }) {
  const { lines, add, setQuantity, open } = useCart();
  const available = product.stock > 0;
  const line = lines.find((l) => l.productId === product.id);

  if (line && available) {
    return (
      <div className={`flex items-center justify-between gap-1.5 rounded-xl border border-brand bg-cream px-2 py-1.5 ${className}`}>
        <button
          type="button"
          onClick={() => setQuantity(product.id, line.quantity - 1)}
          className="qty-btn"
          aria-label="Diminuer la quantité"
        >
          −
        </button>
        <button
          type="button"
          onClick={open}
          className="min-w-0 truncate text-xs font-extrabold text-brand underline-offset-2 hover:underline"
        >
          <span>{line.quantity}</span>
          <span className="hidden sm:inline"> au panier</span>
          <span> · Voir</span>
        </button>
        <button
          type="button"
          disabled={line.quantity >= product.stock}
          onClick={() => setQuantity(product.id, line.quantity + 1)}
          className="qty-btn disabled:opacity-40"
          aria-label="Augmenter la quantité"
        >
          +
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={!available}
      onClick={() =>
        add({
          productId: product.id,
          slug: product.slug,
          name: product.name,
          price: product.price,
          unit: product.unit,
          stock: product.stock,
        })
      }
      className={`touch-manipulation rounded-xl px-3 py-2.5 text-xs font-bold transition sm:px-4 sm:py-3 sm:text-sm ${
        available
          ? "bg-brand-lime text-brand hover:-translate-y-0.5 hover:bg-brand hover:text-white active:scale-[0.99]"
          : "cursor-not-allowed bg-gray-100 text-gray-400"
      } ${className}`}
    >
      {available ? "Ajouter au panier +" : "Indisponible"}
    </button>
  );
}

/**
 * Bouton cœur `♥ / ♡` permettant d'ajouter ou retirer un produit des favoris.
 */
export function FavoriteButton({ slug, name, className = "" }: { slug: string; name: string; className?: string }) {
  const { isFavorite, toggleFavorite } = useCart();
  const active = isFavorite(slug);
  return (
    <button
      type="button"
      aria-label={active ? `Retirer ${name} des favoris` : `Ajouter ${name} aux favoris`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(slug, name);
      }}
      className={`grid h-9 w-9 touch-manipulation place-items-center rounded-full border text-base shadow-sm backdrop-blur transition hover:scale-110 ${
        active ? "border-red-200 bg-white text-red-600" : "border-white/70 bg-white/90 text-brand"
      } ${className}`}
    >
      {active ? "♥" : "♡"}
    </button>
  );
}

/**
 * Bouton « ♡ Favoris » de la barre de navigation principale.
 */
export function FavoritesNavButton() {
  const { favorites, favoritesOnly, setFavoritesOnly } = useCart();
  const pathname = usePathname();
  const router = useRouter();

  function handleClick() {
    const next = !favoritesOnly;
    setFavoritesOnly(next);
    if (pathname !== "/") {
      router.push("/#catalogue");
    } else {
      document.getElementById("catalogue")?.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Afficher mes favoris"
      className={`touch-manipulation whitespace-nowrap rounded-xl px-2.5 py-1.5 text-xs font-semibold transition sm:px-3 sm:py-2 sm:text-sm ${
        favoritesOnly ? "bg-brand-lime text-brand" : "text-brand hover:bg-cream"
      }`}
    >
      <span>{favoritesOnly ? "♥" : "♡"}</span>
      <span className="hidden sm:inline"> Favoris</span>
      {favorites.length > 0 && <span className="ml-1 text-xs font-bold">({favorites.length})</span>}
    </button>
  );
}

/**
 * Bouton d'ouverture du tiroir panier dans l'en-tête avec badge du nombre total d'articles.
 */
export function CartButton() {
  const { count, open } = useCart();
  return (
    <button
      type="button"
      onClick={open}
      className="shrink-0 touch-manipulation whitespace-nowrap rounded-xl bg-brand px-3 py-2 text-xs font-bold text-white shadow-md transition hover:-translate-y-0.5 sm:px-4 sm:py-2.5 sm:text-sm"
    >
      Panier <span className="ml-1 rounded-full bg-brand-lime px-1.5 py-0.5 text-brand sm:px-2">{count}</span>
    </button>
  );
}
