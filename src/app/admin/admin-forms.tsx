/**
 * @file admin/admin-forms.tsx
 * @description Formulaires interactifs du tableau de bord Administrateur (`/admin`) :
 * - Compression automatique des photos côté navigateur en WebP 800×600 (~35–60 Ko) avant envoi.
 * - Mise à jour rapide du statut des commandes, du prix, du stock et de la photo de chaque produit.
 * - Création et retrait de produits.
 */

"use client";

import { useActionState, useState, useTransition } from "react";
import { createProduct, deleteProduct, updateOrderStatus, updateProduct } from "@/app/actions/orders";
import { REGIONS, STATUS_LABELS, resolveProductImage, type Category, type OrderStatus, type Product } from "@/lib/types";

/**
 * Redimensionne et compresse n'importe quelle photo (caméra téléphone ou PC) en WebP léger (max 800×600, qualité 0.80).
 * Réduit une photo brute de 5–10 Mo à ~35–60 Ko pour un chargement instantané sur réseau mobile.
 */
async function compressImageToWebp(file: File): Promise<{ dataUrl: string; kb: number }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 800 / bitmap.width, 600 / bitmap.height);
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D indisponible");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const dataUrl = canvas.toDataURL("image/webp", 0.8);
  const kb = Math.round((dataUrl.length * 3) / 4 / 1024);
  return { dataUrl, kb };
}

/**
 * Formulaire de changement rapide du statut d'une commande.
 */
export function OrderStatusForm({ orderId, currentStatus }: { orderId: string; currentStatus: OrderStatus }) {
  const [state, action, pending] = useActionState(updateOrderStatus, undefined);

  return (
    <form action={action} className="mt-2 flex flex-wrap items-center gap-2 sm:justify-end">
      <input type="hidden" name="id" value={orderId} />
      <select name="status" defaultValue={currentStatus} className="input w-auto py-1.5 text-xs">
        {(Object.keys(STATUS_LABELS) as OrderStatus[]).map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      <button disabled={pending} className="btn-primary px-3 py-1.5 text-xs disabled:opacity-60">
        {pending ? "…" : "Mettre à jour"}
      </button>
      {state?.ok && <span className="text-xs font-bold text-leaf">✓ {state.message}</span>}
      {state?.error && <span className="text-xs text-red-600">{state.error}</span>}
    </form>
  );
}

/**
 * Formulaire d'édition rapide (photo, prix, stock et suppression) d'un produit existant.
 */
export function ProductQuickEditForm({ product }: { product: Product }) {
  const [state, action, pending] = useActionState(updateProduct, undefined);
  const [imageData, setImageData] = useState("");
  const [deleting, startDelete] = useTransition();
  const previewSrc = imageData || resolveProductImage(product.image_url);

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const { dataUrl } = await compressImageToWebp(file);
    setImageData(dataUrl);
  }

  return (
    <form action={action} className="flex flex-wrap items-center justify-between gap-2.5 p-3">
      <input type="hidden" name="id" value={product.id} />
      <input type="hidden" name="image_data" value={imageData} />

      <div className="flex min-w-44 flex-1 items-center gap-2.5">
        <label
          title="Cliquer pour changer la photo du produit"
          className="group relative h-11 w-11 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-line bg-cream"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewSrc} alt={product.name} className="h-full w-full object-cover" />
          <span className="absolute inset-0 grid place-items-center bg-black/45 text-xs text-white opacity-0 transition group-hover:opacity-100">
            📷
          </span>
          <input type="file" accept="image/*" onChange={onPickFile} className="hidden" />
        </label>

        <div className="min-w-0">
          <span className="block truncate text-sm font-semibold text-ink">{product.name}</span>
          <span className="block truncate text-xs text-muted">
            {product.category.icon} {product.unit} · {product.origin}
            {imageData && <b className="ml-1 text-leaf">· Nouvelle photo prête</b>}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="text-xs text-muted">
          Prix
          <input name="price" type="number" min={0} defaultValue={product.price} className="input ml-1 w-24 py-1.5" />
        </label>
        <label className="text-xs text-muted">
          Stock
          <input name="stock" type="number" min={0} defaultValue={product.stock} className="input ml-1 w-16 py-1.5 sm:w-20" />
        </label>
        <button disabled={pending} className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-60">
          {pending ? "…" : "Enregistrer"}
        </button>
        <button
          type="button"
          disabled={deleting}
          title="Retirer ce produit du catalogue"
          onClick={() => {
            if (confirm(`Retirer "${product.name}" du catalogue ?`)) {
              startDelete(() => {
                deleteProduct(product.id);
              });
            }
          }}
          className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-40"
        >
          {deleting ? "…" : "🗑"}
        </button>
        {state?.ok && <span className="text-xs font-bold text-leaf">✓</span>}
        {state?.error && <span className="text-xs text-red-600">{state.error}</span>}
      </div>
    </form>
  );
}

/**
 * Formulaire repliable permettant d'ajouter un nouveau produit avec photo compressée depuis `/admin`.
 */
export function CreateProductForm({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(createProduct, undefined);
  const [imageData, setImageData] = useState("");
  const [imageInfo, setImageInfo] = useState("");

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const { dataUrl, kb } = await compressImageToWebp(file);
    setImageData(dataUrl);
    setImageInfo(`✓ Photo optimisée (${kb} Ko)`);
  }

  return (
    <div className="mb-6 rounded-2xl border border-line bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="font-display text-base font-bold text-brand">Ajouter un nouveau produit</h3>
          <p className="text-xs text-muted">Photo compressée automatiquement pour un affichage ultra-rapide.</p>
        </div>
        <button type="button" onClick={() => setOpen(!open)} className="btn-primary shrink-0 px-4 py-2 text-xs">
          {open ? "Fermer ×" : "+ Nouveau produit"}
        </button>
      </div>

      {open && (
        <form action={action} className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-2">
          <input type="hidden" name="image_data" value={imageData} />

          <label className="text-xs font-semibold">
            Nom du produit *
            <input name="name" required placeholder="Ex. Macabo rouge" className="input mt-1" />
          </label>
          <label className="text-xs font-semibold">
            Catégorie *
            <select name="category_id" required className="input mt-1">
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold">
            Prix unitaire (FCFA) *
            <input name="price" type="number" min={0} required defaultValue={1500} className="input mt-1" />
          </label>
          <label className="text-xs font-semibold">
            Stock disponible *
            <input name="stock" type="number" min={0} required defaultValue={20} className="input mt-1" />
          </label>
          <label className="text-xs font-semibold">
            Unité de vente *
            <input name="unit" required placeholder="Ex. sac · 5 kg" className="input mt-1" />
          </label>
          <label className="text-xs font-semibold">
            Région d’origine *
            <select name="origin" defaultValue="Ouest" className="input mt-1">
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>

          <div className="text-xs font-semibold sm:col-span-2">
            Photo du produit (appareil photo / galerie ou lien URL)
            <div className="mt-1 flex flex-wrap items-center gap-3">
              {imageData && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageData} alt="Aperçu" className="h-14 w-14 rounded-xl border border-line object-cover" />
              )}
              <label className="btn-secondary cursor-pointer px-4 py-2 text-xs">
                📷 Choisir / Prendre une photo
                <input type="file" accept="image/*" onChange={onPickFile} className="hidden" />
              </label>
              <input
                name="image_url"
                type="url"
                placeholder="Ou coller un lien https://..."
                className="input flex-1"
              />
            </div>
            {imageInfo && <p className="mt-1 text-xs text-leaf">{imageInfo}</p>}
          </div>

          <label className="text-xs font-semibold">
            Badge (optionnel)
            <input name="tag" placeholder="Ex. Récolte du jour" className="input mt-1" />
          </label>
          <label className="text-xs font-semibold">
            Description courte (optionnel)
            <input name="description" placeholder="Détails sur la qualité ou la récolte…" className="input mt-1" />
          </label>

          <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
            <button type="submit" disabled={pending} className="btn-primary disabled:opacity-60">
              {pending ? "Création…" : "Publier le produit"}
            </button>
            {state?.ok && <span className="text-xs font-bold text-leaf">✓ {state.message}</span>}
            {state?.error && <span className="text-xs text-red-600">{state.error}</span>}
          </div>
        </form>
      )}
    </div>
  );
}
