"use client";

import { useState } from "react";

export function ReceiptActions({
  orderId,
  orderNumber,
  whatsappUrl,
}: {
  orderId: string;
  orderNumber: string;
  whatsappUrl: string;
}) {
  const [status, setStatus] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const pdfUrl = `/api/commandes/${orderId}/pdf`;
  const filename = `Recu-${orderNumber}.pdf`;

  async function sendPdfToWhatsApp() {
    setBusy(true);
    setStatus("");
    try {
      const response = await fetch(pdfUrl, { credentials: "same-origin" });
      if (!response.ok) throw new Error("Impossible de générer le PDF.");
      const blob = await response.blob();
      const file = new File([blob], filename, { type: "application/pdf" });

      // Sur téléphone (Android / iOS), partage directement le fichier PDF vers WhatsApp
      if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Reçu ${orderNumber} — Tal Agro Shop`,
          text: `Bonjour Tal Agro Shop, voici le reçu PDF de ma commande ${orderNumber}.`,
          files: [file],
        });
        setStatus("Reçu PDF partagé avec succès.");
        return;
      }

      // Sur ordinateur : télécharge automatiquement le .pdf + ouvre la discussion WhatsApp
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);

      window.open(whatsappUrl, "_blank", "noopener");
      setStatus(
        `Le fichier "${filename}" a été téléchargé dans vos Téléchargements. Joignez-le (icône 📎) dans la discussion WhatsApp qui vient de s’ouvrir.`,
      );
    } catch (err) {
      if ((err as Error)?.name !== "AbortError") {
        window.open(whatsappUrl, "_blank", "noopener");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 space-y-3 print:hidden">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-3">
        <button
          type="button"
          onClick={sendPdfToWhatsApp}
          disabled={busy}
          className="btn-primary w-full bg-[#1f8f4e] disabled:opacity-60 sm:w-auto"
        >
          {busy ? "Préparation du PDF…" : "📄 Envoyer le reçu PDF sur WhatsApp"}
        </button>

        <a href={pdfUrl} download={filename} className="btn-primary w-full sm:w-auto">
          ⬇ Télécharger le PDF ({filename})
        </a>

        <button type="button" onClick={() => window.print()} className="btn-secondary w-full sm:w-auto">
          🖨 Imprimer
        </button>
      </div>

      {status && (
        <p role="status" className="rounded-xl border border-green-300 bg-green-50 p-3 text-sm text-green-900">
          {status}
        </p>
      )}
    </div>
  );
}
