import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { getCurrentUser, getMyOrders } from "@/lib/auth";
import { signOut } from "@/app/actions/auth";
import { PAYMENT_LABELS, STATUS_LABELS, formatFcfa } from "@/lib/types";
import { DeliveryProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Mon compte", robots: { index: false } };

export default function AccountPage() {
  return (
    <div className="wrap max-w-4xl py-12">
      <h1 className="font-display text-3xl font-extrabold text-brand">Mon espace client</h1>
      <Suspense fallback={<div className="mt-6 h-48 animate-pulse rounded-2xl bg-white" />}>
        <AccountContent />
      </Suspense>
    </div>
  );
}

async function AccountContent() {
  await connection();
  const user = await getCurrentUser();
  if (!user) {
    return (
      <p className="mt-6">
        Vous n’êtes pas connecté.{" "}
        <Link href="/connexion?suite=/compte" className="font-bold underline">
          Se connecter
        </Link>
      </p>
    );
  }
  const orders = await getMyOrders();

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-white p-5">
        <div>
          <p className="text-sm text-muted">Connecté en tant que</p>
          <p className="font-display text-lg font-extrabold text-brand">
            {user.fullName || "Client Tal Agro Shop"}{" "}
            <span className="text-sm font-normal text-muted">({user.email})</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {user.isAdmin && (
            <Link href="/admin" className="btn-primary">
              Tableau de bord Admin
            </Link>
          )}
          <form action={signOut}>
            <button className="btn-secondary">Se déconnecter</button>
          </form>
        </div>
      </div>

      <DeliveryProfileForm
        initialProfile={{
          fullName: user.fullName,
          phone: user.phone,
          region: user.region,
          address: user.address,
          payment: user.payment,
        }}
      />

      <h2 className="mt-10 font-display text-xl font-bold text-brand">
        Mes commandes et reçus ({orders.length})
      </h2>
      {orders.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-line bg-white p-10 text-center text-muted">
          <p>Aucune commande enregistrée pour le moment.</p>
          <Link href="/#catalogue" className="btn-primary mt-4">
            Découvrir le marché
          </Link>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {orders.map((o) => (
            <li
              key={o.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-white p-5 shadow-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <b className="font-display text-base text-brand">{o.number}</b>
                  <span className="rounded-full bg-cream px-3 py-0.5 text-xs font-bold text-leaf">
                    {STATUS_LABELS[o.status]}
                  </span>
                </div>
                <p className="text-xs text-muted">
                  {new Date(o.created_at).toLocaleString("fr-FR", { timeZone: "Africa/Douala" })} ·{" "}
                  {PAYMENT_LABELS[o.payment]} · {o.region}
                </p>
                <p className="text-sm text-ink">
                  {o.order_items.map((i) => `${i.product_name} ×${i.quantity}`).join(", ")}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-2 font-display text-lg font-extrabold text-brand">{formatFcfa(o.total)}</span>
                <a
                  href={`/api/commandes/${o.id}/pdf`}
                  download={`Recu-${o.number}.pdf`}
                  className="btn-secondary px-4 py-2 text-xs"
                >
                  ⬇ PDF
                </a>
                <Link href={`/compte/commandes/${o.id}`} className="btn-primary px-4 py-2 text-xs">
                  Ouvrir le reçu
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
