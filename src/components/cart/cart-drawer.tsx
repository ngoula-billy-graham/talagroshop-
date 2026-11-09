/**
 * @file cart-drawer.tsx
 * @description Tiroir latéral du panier d'achat et formulaire de livraison avec :
 * - Pré-remplissage automatique du profil client (nom, téléphone, région, adresse, mode de paiement)
 *   depuis Supabase (`getDeliveryProfileAction`) et `localStorage`.
 * - Géolocalisation GPS directe (`navigator.geolocation`).
 * - Soumission transactionnelle vers `placeOrder`.
 */

"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "./cart-provider";
import { getDeliveryProfileAction } from "@/app/actions/auth";
import { placeOrder } from "@/app/actions/orders";
import {
  PAYMENT_LABELS,
  REGIONS,
  SHIPPING_OPTIONS,
  formatFcfa,
  type DeliveryProfile,
  type PaymentMethod,
} from "@/lib/types";

const PROFILE_STORAGE_KEY = "tal-agro-delivery-profile";

export function CartDrawer() {
  const cart = useCart();
  const router = useRouter();
  const [step, setStep] = useState<"cart" | "checkout">("cart");
  const [shipping, setShipping] = useState<number>(SHIPPING_OPTIONS[0]);

  // Champs de livraison pré-remplis automatiquement depuis le profil client
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [region, setRegion] = useState<string>("Ouest");
  const [address, setAddress] = useState("");
  const [payment, setPayment] = useState<PaymentMethod>("livraison");
  const [prefilledFromProfile, setPrefilledFromProfile] = useState(false);

  const [gpsStatus, setGpsStatus] = useState("");
  const [error, setError] = useState("");
  const [needsLogin, setNeedsLogin] = useState(false);
  const [pending, startTransition] = useTransition();

  // Charge automatiquement les coordonnées du profil client dès l'ouverture du panier
  useEffect(() => {
    if (!cart.isOpen) return;

    // 1. Lecture immédiate du cache local si présent
    try {
      const cached = JSON.parse(localStorage.getItem(PROFILE_STORAGE_KEY) ?? "null") as Partial<DeliveryProfile> | null;
      if (cached) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- initialisation à l'ouverture du tiroir
        if (cached.fullName) setFullName((prev) => prev || cached.fullName || "");
        if (cached.phone) setPhone((prev) => prev || cached.phone || "");
        if (cached.region) setRegion((prev) => (prev === "Ouest" ? cached.region || "Ouest" : prev));
        if (cached.address) setAddress((prev) => prev || cached.address || "");
        if (cached.payment) setPayment((prev) => (prev === "livraison" ? cached.payment || "livraison" : prev));
      }
    } catch {}

    // 2. Synchronisation avec le profil serveur Supabase (compte connecté ou dernière commande)
    let cancelled = false;
    getDeliveryProfileAction()
      .then((serverProfile) => {
        if (cancelled || !serverProfile) return;
        const hasSavedInfo = Boolean(serverProfile.fullName || serverProfile.phone || serverProfile.address);
        if (hasSavedInfo) setPrefilledFromProfile(true);

        if (serverProfile.fullName) setFullName((prev) => prev || serverProfile.fullName);
        if (serverProfile.phone) setPhone((prev) => prev || serverProfile.phone);
        if (serverProfile.region) setRegion(serverProfile.region);
        if (serverProfile.address) setAddress((prev) => prev || serverProfile.address);
        if (serverProfile.payment) setPayment(serverProfile.payment);

        try {
          localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(serverProfile));
        } catch {}
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [cart.isOpen]);

  if (!cart.isOpen) return null;

  /** Récupère la position GPS du navigateur et l'ajoute au champ d'adresse */
  function useMyLocation() {
    if (!("geolocation" in navigator)) {
      setGpsStatus("La géolocalisation n’est pas disponible sur cet appareil.");
      return;
    }
    setGpsStatus("Recherche de votre position GPS…");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const point = `Position GPS : ${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
        setAddress((prev) => (prev.trim() ? `${prev.trim()}\n${point}` : point));
        setGpsStatus("✓ Position GPS ajoutée. Complétez le quartier ou un repère si besoin.");
      },
      (err) => {
        setGpsStatus(
          err.code === 1
            ? "Autorisation GPS refusée. Vous pouvez saisir votre adresse manuellement."
            : "Position indisponible. Vérifiez vos réglages GPS et réessayez.",
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  }

  function submit() {
    setError("");
    setNeedsLogin(false);
    startTransition(async () => {
      const result = await placeOrder({
        fullName,
        phone,
        region,
        address,
        shipping,
        payment,
        items: cart.lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
      });
      if (!result.ok) {
        setError(result.error);
        setNeedsLogin(Boolean(result.needsLogin));
        return;
      }
      // Mémorise localement les coordonnées validées pour la prochaine commande
      try {
        localStorage.setItem(
          PROFILE_STORAGE_KEY,
          JSON.stringify({ fullName, phone, region, address, payment }),
        );
      } catch {}

      cart.clear();
      cart.close();
      setStep("cart");
      setGpsStatus("");
      router.push(`/compte/commandes/${result.order.id}?nouvelle=1`);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm" onClick={cart.close}>
      <aside
        className="flex h-dvh w-full max-w-md flex-col gap-4 overflow-y-auto bg-white p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
        aria-label="Panier"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-extrabold text-brand sm:text-2xl">
            Votre panier {cart.count > 0 && <span className="text-base text-muted">({cart.count})</span>}
          </h2>
          <button
            type="button"
            onClick={cart.close}
            className="grid h-10 w-10 touch-manipulation place-items-center rounded-full text-2xl leading-none text-muted hover:bg-cream"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        <p className="rounded-xl bg-cream p-3 text-xs text-muted">
          Commande traitée par Tal Agro Shop. Le paiement se fait à la livraison ou par transfert Mobile Money externe après confirmation.
        </p>

        {cart.lines.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line p-8 text-center text-muted">
            <p>Votre panier est vide.</p>
            <button
              type="button"
              onClick={() => {
                cart.close();
                document.getElementById("catalogue")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="btn-primary mt-4"
            >
              Découvrir le marché
            </button>
          </div>
        ) : (
          <>
            <ul className="divide-y divide-line">
              {cart.lines.map((l) => (
                <li key={l.productId} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <Link href={`/produits/${l.slug}`} onClick={cart.close} className="font-semibold hover:text-brand">
                      {l.name}
                    </Link>
                    <p className="text-xs text-muted">
                      {formatFcfa(l.price)} · {l.unit}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="qty-btn"
                      onClick={() => cart.setQuantity(l.productId, l.quantity - 1)}
                      aria-label="Retirer"
                    >
                      −
                    </button>
                    <b className="w-6 text-center">{l.quantity}</b>
                    <button
                      type="button"
                      className="qty-btn disabled:opacity-40"
                      disabled={l.quantity >= l.stock}
                      onClick={() => cart.setQuantity(l.productId, l.quantity + 1)}
                      aria-label="Ajouter"
                    >
                      +
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="space-y-1 rounded-2xl bg-cream p-4 text-sm">
              <Row label="Sous-total" value={formatFcfa(cart.subtotal)} />
              <Row label="Livraison indicative" value={formatFcfa(shipping)} />
              <Row label="Total indicatif" value={formatFcfa(cart.subtotal + shipping)} strong />
            </div>

            {step === "cart" ? (
              <div className="flex gap-2">
                <button type="button" className="btn-secondary flex-1" onClick={cart.clear}>
                  Vider
                </button>
                <button type="button" className="btn-primary flex-[2]" onClick={() => setStep("checkout")}>
                  Continuer la commande
                </button>
              </div>
            ) : (
              <form action={submit} className="space-y-3 border-t border-line pt-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-lg font-bold text-brand">Livraison</h3>
                  {prefilledFromProfile && (
                    <span className="rounded-full bg-cream px-2.5 py-0.5 text-[11px] font-bold text-leaf">
                      ✓ Profil pré-rempli
                    </span>
                  )}
                </div>

                <Field label="Nom complet du destinataire">
                  <input
                    name="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ex. Jean-Paul Kamga"
                    className="input"
                  />
                </Field>

                <Field label="Téléphone (Joignable par appel / WhatsApp)">
                  <input
                    name="phone"
                    required
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="6XX XXX XXX"
                    className="input"
                  />
                </Field>

                <Field label="Région de livraison">
                  <select
                    name="region"
                    required
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="input"
                  >
                    {REGIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Frais de livraison estimatifs">
                  <select className="input" value={shipping} onChange={(e) => setShipping(Number(e.target.value))}>
                    {SHIPPING_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {formatFcfa(s)} — à confirmer
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Ville, quartier et repère">
                  <textarea
                    name="address"
                    required
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="input"
                    placeholder="Ex. Bafoussam, quartier Tamdja, près de…"
                  />
                </Field>

                <div>
                  <button type="button" onClick={useMyLocation} className="btn-secondary w-full py-2 text-xs">
                    📍 Utiliser ma position GPS
                  </button>
                  {gpsStatus && <p className="mt-1 text-xs text-leaf">{gpsStatus}</p>}
                </div>

                <Field label="Mode de paiement">
                  <select
                    name="payment"
                    value={payment}
                    onChange={(e) => setPayment(e.target.value as PaymentMethod)}
                    className="input"
                  >
                    {Object.entries(PAYMENT_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </Field>

                <p className="text-xs text-muted">
                  Vos coordonnées sont mémorisées sur votre profil client pour vos prochaines commandes. Aucun transfert Mobile Money ne doit être effectué avant confirmation par Tal Agro Shop.
                </p>

                {error && (
                  <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                    {error}{" "}
                    {needsLogin && (
                      <Link href="/connexion" onClick={cart.close} className="font-bold underline">
                        Se connecter
                      </Link>
                    )}
                  </p>
                )}

                <button type="submit" disabled={pending} className="btn-primary w-full disabled:opacity-60">
                  {pending ? "Enregistrement…" : "Envoyer ma commande"}
                </button>
                <button type="button" onClick={() => setStep("cart")} className="w-full text-sm text-muted underline">
                  Retour au panier
                </button>
              </form>
            )}
          </>
        )}
      </aside>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? "border-t border-line pt-2 text-base font-bold text-brand" : ""}`}>
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-semibold text-ink">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}
