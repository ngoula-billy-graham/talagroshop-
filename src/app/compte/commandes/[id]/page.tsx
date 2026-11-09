import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getOrder } from "@/lib/auth";
import { whatsappOrderUrl } from "@/lib/whatsapp";
import { PAYMENT_LABELS, STATUS_LABELS, formatFcfa } from "@/lib/types";
import { ReceiptActions } from "./print-button";

export const metadata: Metadata = { title: "Reçu de commande", robots: { index: false } };

export default function ReceiptPage({ params, searchParams }: PageProps<"/compte/commandes/[id]">) {
  return (
    <div className="wrap max-w-3xl py-10">
      <Link href="/compte" className="text-sm font-semibold text-leaf print:hidden">← Mes commandes</Link>
      <Suspense fallback={<div className="mt-6 h-96 animate-pulse rounded-3xl bg-white" />}>
        <Receipt params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Receipt({
  params,
  searchParams,
}: {
  params: PageProps<"/compte/commandes/[id]">["params"];
  searchParams: PageProps<"/compte/commandes/[id]">["searchParams"];
}) {
  await connection();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const isNew = sp.nouvelle === "1";
  const order = await getOrder(id);
  if (!order) notFound();
  const waUrl = whatsappOrderUrl(order);

  return (
    <>
      {isNew && (
        <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-5 print:hidden">
          <p className="font-bold text-green-900">Commande enregistrée · {order.number}</p>
          <p className="mt-1 text-sm text-green-900">
            Cliquez sur <b>« Envoyer le reçu PDF sur WhatsApp »</b> ci-dessous pour générer le fichier{" "}
            <code>Recu-{order.number}.pdf</code> et le transmettre à Tal Agro Shop.
          </p>
        </div>
      )}

      <ReceiptActions orderId={order.id} orderNumber={order.number} whatsappUrl={waUrl} />

      <article className="mt-6 rounded-3xl border border-line bg-white p-5 sm:p-8 print:border-0 print:p-0 print:shadow-none">
        <header className="flex flex-wrap justify-between gap-4 border-b-2 border-brand pb-4">
          <div>
            <h1 className="font-display text-xl font-extrabold text-brand sm:text-2xl">Tal Agro Shop</h1>
            <p className="text-sm text-muted">Reçu de commande</p>
          </div>
          <div className="text-left text-sm sm:text-right">
            <b>{order.number}</b>
            <p>{new Date(order.created_at).toLocaleString("fr-FR", { timeZone: "Africa/Douala" })}</p>
            <p className="mt-1 inline-block rounded-full bg-cream px-3 py-1 text-xs font-bold text-leaf">{STATUS_LABELS[order.status]}</p>
          </div>
        </header>

        <p className="mt-4 text-sm leading-relaxed">
          Client : <b>{order.full_name}</b><br />
          Téléphone : {order.phone}<br />
          Adresse : {order.region} — {order.address}<br />
          Paiement : {PAYMENT_LABELS[order.payment]}
        </p>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[320px] text-left text-xs sm:text-sm">
            <thead className="border-b border-line text-muted">
              <tr>
                <th className="py-2 pr-2">Article</th>
                <th className="px-2">Qté</th>
                <th className="whitespace-nowrap px-2">Prix unitaire</th>
                <th className="whitespace-nowrap pl-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.order_items.map((i) => (
                <tr key={i.product_name} className="border-b border-line">
                  <td className="py-2 pr-2">
                    {i.product_name} <span className="text-xs text-muted">({i.unit})</span>
                  </td>
                  <td className="px-2">{i.quantity}</td>
                  <td className="whitespace-nowrap px-2">{formatFcfa(i.unit_price)}</td>
                  <td className="whitespace-nowrap pl-2 text-right">{formatFcfa(i.unit_price * i.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 space-y-1 text-right text-sm">
          <p>Articles : {formatFcfa(order.subtotal)}</p>
          <p>Livraison (indicative) : {formatFcfa(order.shipping)}</p>
          <p className="font-display text-lg font-extrabold text-brand">Total : {formatFcfa(order.total)}</p>
        </div>
        <p className="mt-8 text-xs text-muted">Aucun paiement n’a été encaissé par le site. Montant final confirmé par Tal Agro Shop.</p>
      </article>
    </>
  );
}
