import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { getAllOrders, getCurrentUser } from "@/lib/auth";
import { getCatalog } from "@/lib/catalog";
import { PAYMENT_LABELS, STATUS_LABELS, formatFcfa } from "@/lib/types";
import { CreateProductForm, OrderStatusForm, ProductQuickEditForm } from "./admin-forms";

export const metadata: Metadata = { title: "Administration", robots: { index: false } };

export default function AdminPage({ searchParams }: PageProps<"/admin">) {
  return (
    <div className="wrap py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-brand">Tableau de bord Administrateur</h1>
          <p className="text-sm text-muted">Gérez vos commandes clients, vos tarifs et vos stocks en temps réel.</p>
        </div>
        <Link href="/#catalogue" className="btn-secondary">
          Voir la boutique ↗
        </Link>
      </div>
      <Suspense fallback={<div className="mt-6 h-96 animate-pulse rounded-2xl bg-white" />}>
        <AdminContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function AdminContent({ searchParams }: { searchParams: PageProps<"/admin">["searchParams"] }) {
  await connection();
  const sp = await searchParams;
  const status = typeof sp.statut === "string" ? sp.statut : undefined;
  const user = await getCurrentUser();
  if (!user?.isAdmin) {
    return (
      <p className="mt-6 rounded-2xl bg-orange-50 p-6 text-orange-900">
        Accès réservé. Pour donner les droits admin à un compte, exécutez dans Supabase :
        <code className="mt-2 block rounded bg-white p-2 text-xs">
          update public.profiles set is_admin = true;
        </code>
      </p>
    );
  }
  const [allOrders, filteredOrders, { categories, products }] = await Promise.all([
    getAllOrders(),
    getAllOrders(status),
    getCatalog(),
  ]);

  const totalRevenue = allOrders
    .filter((o) => o.status !== "annulee")
    .reduce((sum, o) => sum + o.total, 0);
  const pendingCount = allOrders.filter((o) => o.status === "enregistree" || o.status === "confirmee").length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;

  return (
    <>
      {/* Bandeau d'indicateurs clés (KPIs) */}
      <div className="mt-6 grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        <KpiCard label="Chiffre d’affaires (hors annulées)" value={formatFcfa(totalRevenue)} />
        <KpiCard label="Commandes à traiter" value={String(pendingCount)} highlight={pendingCount > 0} />
        <KpiCard label="Total commandes" value={String(allOrders.length)} />
        <KpiCard label="Produits en rupture" value={`${outOfStockCount} / ${products.length}`} warn={outOfStockCount > 0} />
      </div>

      <div className="mt-8 grid gap-10 xl:grid-cols-[1.35fr_1fr]">
        <section>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="mr-auto font-display text-xl font-bold text-brand">
              Commandes ({filteredOrders.length})
            </h2>
            <FilterLink label="Toutes" active={!status} href="/admin" />
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <FilterLink key={value} label={label} active={status === value} href={`/admin?statut=${value}`} />
            ))}
          </div>

          <ul className="mt-4 space-y-3">
            {filteredOrders.length === 0 && (
              <li className="rounded-2xl border border-dashed border-line bg-white p-8 text-center text-muted">
                Aucune commande dans cette catégorie.
              </li>
            )}
            {filteredOrders.map((o) => (
              <li key={o.id} className="rounded-2xl border border-line bg-white p-4 shadow-xs sm:p-5">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/compte/commandes/${o.id}`} className="font-display font-extrabold text-brand underline">
                        {o.number}
                      </Link>
                      <span className="rounded-full bg-cream px-2.5 py-0.5 text-xs font-bold text-leaf">
                        {STATUS_LABELS[o.status]}
                      </span>
                    </div>
                    <p className="text-xs text-muted">
                      {new Date(o.created_at).toLocaleString("fr-FR", { timeZone: "Africa/Douala" })} ·{" "}
                      <b>{o.full_name || "Client"}</b> ·{" "}
                      <a href={`tel:${o.phone}`} className="underline">
                        {o.phone}
                      </a>
                    </p>
                    <p className="text-xs text-muted">
                      📍 {o.region} — {o.address} · 💳 {PAYMENT_LABELS[o.payment]}
                    </p>
                    <p className="pt-1 text-sm font-medium text-ink">
                      {o.order_items.map((i) => `${i.product_name} ×${i.quantity}`).join(", ")}
                    </p>
                  </div>
                  <div className="border-t border-line pt-3 sm:border-0 sm:pt-0 sm:text-right">
                    <p className="font-display text-lg font-extrabold text-brand">{formatFcfa(o.total)}</p>
                    <div className="mt-1 flex flex-wrap gap-3 sm:justify-end sm:gap-2">
                      <a
                        href={`/api/commandes/${o.id}/pdf`}
                        download={`Recu-${o.number}.pdf`}
                        className="text-xs font-bold text-leaf underline"
                      >
                        ⬇ Reçu PDF
                      </a>
                      <a
                        href={`https://wa.me/${o.phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener"
                        className="text-xs font-bold text-brand underline"
                      >
                        💬 WhatsApp client
                      </a>
                    </div>
                    <OrderStatusForm orderId={o.id} currentStatus={o.status} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-4 font-display text-xl font-bold text-brand">Catalogue, prix & stocks ({products.length})</h2>
          <CreateProductForm categories={categories} />
          <ul className="divide-y divide-line rounded-2xl border border-line bg-white">
            {products.map((p) => (
              <li key={p.id}>
                <ProductQuickEditForm product={p} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}

function KpiCard({
  label,
  value,
  highlight,
  warn,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  warn?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <p className="text-xs font-semibold text-muted">{label}</p>
      <p
        className={`mt-1 font-display text-2xl font-extrabold ${
          warn ? "text-orange-600" : highlight ? "text-leaf" : "text-brand"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function FilterLink({ label, active, href }: { label: string; active: boolean; href: string }) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1 text-xs font-bold transition ${
        active ? "bg-brand text-white" : "bg-white text-brand hover:bg-cream"
      }`}
    >
      {label}
    </Link>
  );
}
