/**
 * @file compte/profile-form.tsx
 * @description Formulaire permettant au client d'enregistrer ou de modifier ses coordonnées de livraison
 * par défaut (nom complet, téléphone, région, adresse / repère GPS et mode de paiement préféré).
 * Ces informations pré-remplissent automatiquement le panier lors de chaque nouvelle commande.
 */

"use client";

import { useActionState, useEffect, useState } from "react";
import { updateDeliveryProfile } from "@/app/actions/auth";
import { PAYMENT_LABELS, REGIONS, type DeliveryProfile } from "@/lib/types";

const PROFILE_STORAGE_KEY = "tal-agro-delivery-profile";

export function DeliveryProfileForm({ initialProfile }: { initialProfile: DeliveryProfile }) {
  const [state, action, pending] = useActionState(updateDeliveryProfile, undefined);
  const [fullName, setFullName] = useState(initialProfile.fullName);
  const [phone, setPhone] = useState(initialProfile.phone);
  const [region, setRegion] = useState(initialProfile.region || "Ouest");
  const [address, setAddress] = useState(initialProfile.address);
  const [payment, setPayment] = useState(initialProfile.payment || "livraison");
  const [gpsStatus, setGpsStatus] = useState("");

  // Synchronise aussi le profil local pour un pré-remplissage instantané dans le tiroir du panier
  useEffect(() => {
    if (state?.message) {
      try {
        localStorage.setItem(
          PROFILE_STORAGE_KEY,
          JSON.stringify({ fullName, phone, region, address, payment }),
        );
      } catch {}
    }
  }, [state, fullName, phone, region, address, payment]);

  /** Récupère la position GPS du navigateur et l'ajoute au champ d'adresse par défaut */
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
        setGpsStatus("✓ Position GPS ajoutée à votre adresse.");
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

  return (
    <section className="mt-8 rounded-2xl border border-line bg-white p-5 shadow-xs sm:p-6">
      <div className="mb-4">
        <h2 className="font-display text-xl font-bold text-brand">Mes coordonnées de livraison</h2>
        <p className="text-xs text-muted sm:text-sm">
          Ces informations sont pré-remplies automatiquement lors de chacune de vos commandes.
        </p>
      </div>

      <form action={action} className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-ink">
          Nom complet du destinataire *
          <input
            name="full_name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Ex. Jean-Paul Kamga"
            className="input mt-1"
          />
        </label>

        <label className="text-sm font-semibold text-ink">
          Téléphone (Appel / WhatsApp)
          <input
            name="phone"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Ex. 698 73 66 35"
            className="input mt-1"
          />
        </label>

        <label className="text-sm font-semibold text-ink">
          Région de livraison par défaut
          <select
            name="region"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="input mt-1"
          >
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-semibold text-ink">
          Mode de paiement préféré
          <select
            name="payment"
            value={payment}
            onChange={(e) => setPayment(e.target.value as DeliveryProfile["payment"])}
            className="input mt-1"
          >
            {Object.entries(PAYMENT_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>

        <div className="sm:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="profile-address" className="text-sm font-semibold text-ink">
              Ville, quartier et repère de livraison
            </label>
            <button
              type="button"
              onClick={useMyLocation}
              className="text-xs font-bold text-leaf underline hover:text-brand"
            >
              📍 Ajouter ma position GPS
            </button>
          </div>
          <textarea
            id="profile-address"
            name="address"
            rows={2}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Ex. Bafoussam, quartier Tamdja, en face de la boulangerie…"
            className="input mt-1"
          />
          {gpsStatus && <p className="mt-1 text-xs text-leaf">{gpsStatus}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <button type="submit" disabled={pending} className="btn-primary w-full sm:w-auto disabled:opacity-60">
            {pending ? "Enregistrement…" : "Enregistrer mes coordonnées"}
          </button>
          {state?.message && (
            <span role="status" className="text-sm font-bold text-leaf">
              ✓ {state.message}
            </span>
          )}
          {state?.error && (
            <span role="alert" className="text-sm text-red-600">
              {state.error}
            </span>
          )}
        </div>
      </form>
    </section>
  );
}
