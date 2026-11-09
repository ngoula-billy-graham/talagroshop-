import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCatalog, getProductBySlug } from "@/lib/catalog";
import { AddToCartButton, FavoriteButton } from "@/components/cart/cart-buttons";
import { ProductCard } from "@/components/product-card";
import { formatFcfa, resolveProductImage } from "@/lib/types";

export async function generateMetadata({ params }: PageProps<"/produits/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Produit introuvable" };
  const description = `${product.name} (${product.unit}) — ${formatFcfa(product.price)}. Origine : ${product.origin}, Cameroun. Commandez en ligne chez Tal Agro Shop.`;
  return {
    title: product.name,
    description,
    openGraph: { title: product.name, description, images: [resolveProductImage(product.image_url)] },
  };
}

export default function ProductPage({ params }: PageProps<"/produits/[slug]">) {
  return (
    <div className="wrap py-10">
      <Link href="/#catalogue" className="text-sm font-semibold text-leaf hover:underline">
        ← Retour au catalogue
      </Link>
      <Suspense fallback={<div className="mt-6 h-96 animate-pulse rounded-3xl bg-white" />}>
        <ProductDetail params={params} />
      </Suspense>
    </div>
  );
}

async function ProductDetail({ params }: { params: PageProps<"/produits/[slug]">["params"] }) {
  const { slug } = await params;
  const [product, { products }] = await Promise.all([getProductBySlug(slug), getCatalog()]);
  if (!product) notFound();

  const related = products
    .filter((p) => p.category.slug === product.category.slug && p.slug !== product.slug)
    .slice(0, 4);

  return (
    <>
      <article className="mt-6 grid gap-6 sm:gap-10 md:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-3xl bg-white shadow-lg">
          <Image
            src={resolveProductImage(product.image_url)}
            alt={product.name}
            fill
            priority
            unoptimized={resolveProductImage(product.image_url).startsWith("data:")}
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
          <FavoriteButton slug={product.slug} name={product.name} className="absolute right-4 top-4" />
        </div>
        <div className="flex flex-col justify-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-leaf sm:text-sm">
            {product.category.icon} {product.category.name} · {product.origin}, Cameroun
          </p>
          <h1 className="mt-2 font-display text-2xl font-extrabold text-brand sm:text-4xl">{product.name}</h1>
          {product.tag && (
            <span className="mt-3 inline-block w-fit rounded-full bg-brand-lime px-3 py-1 text-xs font-bold text-brand">
              {product.tag}
            </span>
          )}
          <p className="mt-5 font-display text-2xl font-extrabold text-brand sm:mt-6 sm:text-3xl">
            {formatFcfa(product.price)} <span className="text-sm font-medium text-muted sm:text-base">/ {product.unit}</span>
          </p>
          <p className={`mt-2 text-sm font-semibold ${product.stock ? "text-leaf" : "text-orange-600"}`}>
            {product.stock ? `✓ ${product.stock} disponibles en stock` : "Épuisé pour le moment"}
          </p>
          {product.description && <p className="mt-5 text-sm leading-relaxed text-muted sm:mt-6 sm:text-base">{product.description}</p>}

          <div className="mt-6 flex flex-wrap items-center gap-3 sm:mt-8">
            <AddToCartButton product={product} className="w-full sm:min-w-56 sm:w-auto" />
          </div>

          <div className="mt-6 rounded-2xl border border-line bg-white p-4 text-xs leading-relaxed text-muted sm:mt-8">
            <b className="block text-ink">Livraison & Paiement</b>
            Expédition depuis Bafoussam (Ouest). Les frais de livraison et la disponibilité finale sont confirmés par
            téléphone ou WhatsApp avant tout règlement.
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section className="mt-12 sm:mt-16">
          <h2 className="mb-5 font-display text-xl font-extrabold text-brand sm:mb-6 sm:text-2xl">
            Autres produits du rayon {product.category.name}
          </h2>
          <div className="grid grid-cols-1 gap-3.5 min-[380px]:grid-cols-2 sm:gap-4 md:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
