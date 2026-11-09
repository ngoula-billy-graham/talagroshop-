/**
 * @file product-browser.tsx
 * @description Barre de catégories, filtres multicritères (recherche, origine, disponibilité, favoris, tri)
 * et affichage dynamique de la grille de produits côté client.
 */

"use client";

import { useMemo, useState } from "react";
import { useCart } from "./cart/cart-provider";
import { ProductCard } from "./product-card";
import type { Category, Product } from "@/lib/types";

type Sort = "default" | "low" | "high" | "name";

export function ProductBrowser({
  categories,
  products,
}: {
  categories: Category[];
  products: Product[];
}) {
  const { favorites, favoritesOnly, setFavoritesOnly } = useCart();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [origin, setOrigin] = useState("all");
  const [inStock, setInStock] = useState(false);
  const [sort, setSort] = useState<Sort>("default");

  const origins = useMemo(() => [...new Set(products.map((p) => p.origin))].sort(), [products]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = products.filter(
      (p) =>
        (category === "all" || p.category.slug === category) &&
        (!favoritesOnly || favorites.includes(p.slug)) &&
        (origin === "all" || p.origin === origin) &&
        (!inStock || p.stock > 0) &&
        (!q || `${p.name} ${p.category.name} ${p.origin} ${p.tag ?? ""}`.toLowerCase().includes(q)),
    );
    if (sort === "low") list.sort((a, b) => a.price - b.price);
    if (sort === "high") list.sort((a, b) => b.price - a.price);
    if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name, "fr"));
    return list;
  }, [products, query, category, favoritesOnly, favorites, origin, inStock, sort]);

  function resetFilters() {
    setQuery("");
    setCategory("all");
    setOrigin("all");
    setInStock(false);
    setFavoritesOnly(false);
    setSort("default");
  }

  return (
    <>
      <div className="mb-5 grid grid-cols-2 gap-2.5 sm:mb-6 sm:grid-cols-3 sm:gap-3 lg:grid-cols-7">
        <CategoryChip
          active={category === "all" && !favoritesOnly}
          onClick={() => {
            setCategory("all");
            setFavoritesOnly(false);
          }}
          icon="🧺"
          name="Tout voir"
          sub={`${products.length} produits`}
        />
        {categories.map((c) => (
          <CategoryChip
            key={c.slug}
            active={category === c.slug}
            onClick={() => {
              setCategory(c.slug);
              setFavoritesOnly(false);
            }}
            icon={c.icon}
            name={c.name}
            sub={c.description}
          />
        ))}
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2.5 rounded-2xl border border-line bg-white/80 p-3 backdrop-blur sm:gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher : tomates, poulets, manioc, Ouest…"
          aria-label="Rechercher un produit"
          className="input w-full sm:min-w-56 sm:flex-1"
        />
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:gap-3">
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="input w-full sm:w-auto" aria-label="Trier">
            <option value="default">Trier : recommandés</option>
            <option value="low">Prix croissant</option>
            <option value="high">Prix décroissant</option>
            <option value="name">Nom A–Z</option>
          </select>
          <select value={origin} onChange={(e) => setOrigin(e.target.value)} className="input w-full sm:w-auto" aria-label="Origine">
            <option value="all">Toutes origines</option>
            {origins.map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div className="flex w-full flex-wrap items-center justify-between gap-3 sm:w-auto sm:flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted sm:text-sm">
              <input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} /> En stock
            </label>
            <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted sm:text-sm">
              <input type="checkbox" checked={favoritesOnly} onChange={(e) => setFavoritesOnly(e.target.checked)} /> ♥ Favoris ({favorites.length})
            </label>
          </div>
          <span className="ml-auto text-xs font-semibold text-brand sm:text-sm" aria-live="polite">
            {visible.length} {visible.length > 1 ? "produits" : "produit"}
          </span>
        </div>
      </div>

      {visible.length ? (
        <div className="grid grid-cols-1 gap-3.5 min-[380px]:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {visible.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-line bg-white p-10 text-center text-muted">
          <p>
            {favoritesOnly
              ? "Vous n’avez pas encore ajouté de produit en favori (cliquez sur le cœur ♡ d’un article)."
              : "Aucun produit ne correspond à votre recherche."}
          </p>
          <button type="button" onClick={resetFilters} className="btn-secondary mt-4">
            Réinitialiser les filtres
          </button>
        </div>
      )}
    </>
  );
}

function CategoryChip({
  active,
  onClick,
  icon,
  name,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  name: string;
  sub: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex touch-manipulation items-center gap-2.5 rounded-2xl border p-2.5 text-left transition sm:gap-3 sm:p-3 ${
        active ? "border-brand bg-brand-lime/40 shadow-sm" : "border-line bg-white hover:border-leaf"
      }`}
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-cream text-lg sm:h-10 sm:w-10 sm:text-xl">
        {icon}
      </span>
      <span className="min-w-0">
        <strong className="block truncate text-xs text-ink sm:text-sm">{name}</strong>
        <small className="block truncate text-[11px] text-muted sm:text-xs">{sub}</small>
      </span>
    </button>
  );
}
