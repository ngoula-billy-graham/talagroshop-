"use client";

import { useEffect, useState } from "react";
import { SHOP_PHONE_DISPLAY } from "@/lib/types";

export function ReceiptActions({
  orderId,
  orderNumber,
  whatsappUrl,
  isNew = false,
}: {
  orderId: string;
  orderNumber: string;
  whatsappUrl: string;
  isNew?: boolean;
}) {
  const [status, setStatus] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [autoTimer, setAutoTimer] = useState<number | null>(isNew ? 3 : null);
  const [canShareFiles, setCanShareFiles] = useState(false);

  const pdfUrl = `/api/commandes/${orderId}/pdf`;
  const filename = `Recu-${orderNumber}.pdf`;

  // Vérifie la compatibilité de l'API de partage natif (Web Share API)
  useEffect(() => {
    if (typeof navigator !== "undefined" && typeof navigator.canShare === "function") {
      try {
        const dummyFile = new File([""], "test.pdf", { type: "application/pdf" });
        if (navigator.canShare({ files: [dummyFile] })) {
          setCanShareFiles(true);
        }
      } catch {}
    }
  }, []);

  // Déclenche le téléchargement du PDF de manière synchrone et sécurisée
  function triggerPdfDownload() {
    try {
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {}
  }

  // Gestion de la réaction automatique lors d'une nouvelle commande (isNew === true)
  useEffect(() => {
    if (!isNew || autoTimer === null) return;

    if (autoTimer === 3) {
      // Téléchargement immédiat du reçu PDF pour que le client l'ait sur son appareil
      triggerPdfDownload();
    }

    if (autoTimer === 0) {
      setAutoTimer(null);
      // Sur mobile (Android / iOS), redirection directe vers wa.me qui ouvre l'application WhatsApp / WhatsApp Business
      const isMobile = typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (isMobile) {
        window.location.href = whatsappUrl;
      }
      return;
    }

    const timer = setTimeout(() => {
      setAutoTimer((prev) => (prev !== null && prev > 0 ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [isNew, autoTimer, whatsappUrl]);

  // Envoi direct vers WhatsApp (garantit l'ouverture vers le compte de l'admin même sans contact enregistré)
  function handleDirectWhatsApp() {
    setAutoTimer(null);
    triggerPdfDownload();
    setStatus(
      `✓ Reçu "${filename}" téléchargé sur votre appareil. La discussion WhatsApp avec l'administrateur (${SHOP_PHONE_DISPLAY}) s'ouvre avec votre récapitulatif complet.`,
    );
  }

  // Partage direct du fichier PDF via le sélecteur du téléphone (pour les clients qui ont déjà le contact enregistré)
  async function sharePdfFileDirectly() {
    setAutoTimer(null);
    setBusy(true);
    setStatus("");
    try {
      const response = await fetch(pdfUrl, { credentials: "same-origin" });
      if (!response.ok) throw new Error("Impossible de récupérer le PDF.");
      const blob = await response.blob();
      const file = new File([blob], filename, { type: "application/pdf" });

      if (typeof navigator.share === "function") {
        await navigator.share({
          title: `Reçu ${orderNumber} — Tal Agro Shop`,
          text: `Bonjour Tal Agro Shop, voici le reçu PDF de ma commande ${orderNumber}.`,
          files: [file],
        });
        setStatus("✓ Fichier PDF partagé avec succès.");
      }
    } catch (err) {
      if ((err as Error)?.name !== "AbortError") {
        // En cas de refus ou de contact manquant, on bascule vers la discussion WhatsApp directe
        window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 space-y-4 print:hidden">
      {/* Bannière de confirmation automatique pour une nouvelle commande */}
      {isNew && (
        <div className="relative overflow-hidden rounded-2xl border-2 border-[#25D366] bg-gradient-to-br from-green-50 to-white p-5 shadow-sm">
          <div className="flex items-start gap-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-xl font-black text-white shadow">
              ✓
            </span>
            <div className="flex-1">
              <h2 className="font-display text-lg font-extrabold text-green-950">
                Commande {orderNumber} enregistrée avec succès !
              </h2>
              <p className="mt-1 text-sm text-green-900">
                Le reçu PDF officiel <b>{filename}</b> a été téléchargé sur votre appareil.
              </p>

              {autoTimer !== null && autoTimer > 0 ? (
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 rounded-lg bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-900">
                    <span className="inline-block h-2 w-2 animate-ping rounded-full bg-[#25D366]" />
                    Ouverture automatique de WhatsApp dans {autoTimer}s…
                  </div>
                  <a
                    href={whatsappUrl}
                    onClick={handleDirectWhatsApp}
                    className="text-xs font-bold text-[#1f8f4e] underline hover:text-[#16703c]"
                  >
                    Ouvrir immédiatement
                  </a>
                  <button
                    type="button"
                    onClick={() => setAutoTimer(null)}
                    className="text-xs text-muted underline hover:text-black"
                  >
                    Rester sur cette page
                  </button>
                </div>
              ) : (
                <p className="mt-2 text-xs font-medium text-green-800">
                  Transmettez votre commande à l&apos;administrateur au <b>{SHOP_PHONE_DISPLAY}</b> pour confirmation et expédition rapide.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bloc principal d'actions */}
      <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">
          Transmission à l&apos;administrateur
        </p>

        <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
          {/* Bouton direct WhatsApp (infaillible, compatible WhatsApp standard et WhatsApp Business) */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleDirectWhatsApp}
            className="btn-primary flex w-full items-center justify-center gap-2.5 bg-[#25D366] px-5 py-3 text-base font-extrabold text-white shadow-md transition-all hover:bg-[#1ebd5b] active:scale-[0.98] sm:w-auto"
          >
            <span className="text-xl">💬</span>
            <span>Envoyer sur WhatsApp ({SHOP_PHONE_DISPLAY})</span>
          </a>

          {/* Téléchargement direct du PDF */}
          <a
            href={pdfUrl}
            download={filename}
            className="btn-secondary flex w-full items-center justify-center gap-2 py-3 sm:w-auto"
          >
            <span>⬇</span>
            <span>Télécharger le PDF ({filename})</span>
          </a>

          {/* Partage natif de fichier (si l'appareil le supporte et pour les clients ayant déjà le contact) */}
          {canShareFiles && (
            <button
              type="button"
              onClick={sharePdfFileDirectly}
              disabled={busy}
              className="btn-secondary flex w-full items-center justify-center gap-2 py-3 disabled:opacity-60 sm:w-auto"
              title="Utilisez cette option si vous avez déjà enregistré le contact de Tal Agro Shop dans votre répertoire"
            >
              <span>📎</span>
              <span>{busy ? "Génération du PDF…" : "Partager le fichier PDF"}</span>
            </button>
          )}

          {/* Impression papier */}
          <button
            type="button"
            onClick={() => window.print()}
            className="btn-secondary flex w-full items-center justify-center gap-2 py-3 sm:w-auto"
          >
            <span>🖨</span>
            <span>Imprimer</span>
          </button>
        </div>

        <p className="mt-3 text-xs text-muted">
          💡 <b>Astuce :</b> Le bouton vert ouvre directement la conversation avec le compte administrateur Tal Agro Shop sur <b>WhatsApp</b> ou <b>WhatsApp Business</b>, sans avoir besoin d&apos;enregistrer le numéro dans vos contacts.
        </p>
      </div>

      {/* Message de statut / confirmation */}
      {status && (
        <div role="status" className="rounded-xl border border-green-300 bg-green-50 p-3.5 text-sm text-green-950 whitespace-pre-line shadow-sm">
          {status}
        </div>
      )}
    </div>
  );
}
