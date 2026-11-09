/**
 * @file product-card.tsx
 * @description Carte de présentation d'un produit dans la grille du catalogue.
 * Utilise `next/image` pour compresser et redimensionner automatiquement les photos en WebP/AVIF.
 */

import Image from "next/image";
import Link from "next/link";
import { AddToCartButton, FavoriteButton } from "./cart/cart-buttons";
import { formatFcfa, resolveProductImage, type Product } from "@/lib/types";

export function ProductCard({ product }: { product: Product }) {
  const imageUrl = resolveProductImage(product.image_url);

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative aspect-[4/3] overflow-hidden bg-cream">
        <Link href={`/produits/${product.slug}`} className="relative block h-full w-full">
          <Image
            src={imageUrl}
            alt={`${product.name} — produit de ${product.origin}, Cameroun`}
            fill
            unoptimized={imageUrl.startsWith("data:")}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        </Link>
        {product.tag && (
          <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-brand backdrop-blur">
            {product.tag}
          </span>
        )}
        <FavoriteButton slug={product.slug} name={product.name} className="absolute right-3 top-3" />
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3 sm:p-4">
        <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-leaf sm:text-xs">
          {product.origin} · Cameroun
        </p>
        <h3 className="font-display text-base font-bold leading-snug text-ink sm:text-lg">
          <Link href={`/produits/${product.slug}`} className="line-clamp-2 hover:text-brand">
            {product.name}
          </Link>
        </h3>
        <p className="truncate text-xs text-muted sm:text-sm">
          {product.category.name} · {product.unit}
        </p>
        <div className="mt-auto flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 pt-2.5 sm:pt-3">
          <span className="font-display text-base font-extrabold text-brand sm:text-xl">
            {formatFcfa(product.price)}
          </span>
          <span className={`text-[11px] font-semibold sm:text-xs ${product.stock ? "text-leaf" : "text-orange-600"}`}>
            {product.stock ? `${product.stock} en stock` : "Épuisé"}
          </span>
        </div>
        <AddToCartButton product={product} className="mt-2.5 w-full sm:mt-3" />
      </div>
    </article>
  );
}
