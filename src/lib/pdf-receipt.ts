import { PAYMENT_LABELS, SHOP_PHONE_DISPLAY, STATUS_LABELS, type Order } from "./types";

/**
 * Convertit une chaîne UTF-8 en octets Windows-1252 (WinAnsiEncoding)
 * et échappe les caractères spéciaux des littéraux PDF.
 */
function winAnsi(input: string): string {
  const normalized = input
    .replace(/\u202f|\u00a0/g, " ")
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/—|–/g, "-")
    .replace(/œ/g, "oe")
    .replace(/Œ/g, "OE");

  let out = "";
  for (const ch of normalized) {
    const code = ch.codePointAt(0) ?? 32;
    const byte = code <= 0xff ? code : 63; // '?' si hors WinAnsi
    if (byte === 0x28 || byte === 0x29 || byte === 0x5c) {
      out += "\\" + String.fromCharCode(byte);
    } else if (byte < 32 || byte > 126) {
      out += "\\" + byte.toString(8).padStart(3, "0");
    } else {
      out += String.fromCharCode(byte);
    }
  }
  return out;
}

const fcfa = (n: number) => `${n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} FCFA`;

/**
 * Génère un fichier PDF A4 (595 × 842 pt) officiel pour une commande Tal Agro Shop.
 */
export function buildOrderReceiptPdf(order: Order): Uint8Array {
  const ops: string[] = [];
  const text = (x: number, y: number, size: number, bold: boolean, str: string, rgb: [number, number, number] = [0.1, 0.15, 0.12]) => {
    ops.push(
      `BT /${bold ? "F2" : "F1"} ${size} Tf ${rgb[0]} ${rgb[1]} ${rgb[2]} rg 1 0 0 1 ${x.toFixed(1)} ${y.toFixed(1)} Tm (${winAnsi(str)}) Tj ET`,
    );
  };
  const rect = (x: number, y: number, w: number, h: number, rgb: [number, number, number]) => {
    ops.push(`${rgb[0]} ${rgb[1]} ${rgb[2]} rg ${x.toFixed(1)} ${y.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)} re f`);
  };
  const line = (x1: number, y1: number, x2: number, y2: number, rgb: [number, number, number] = [0.83, 0.88, 0.83]) => {
    ops.push(`${rgb[0]} ${rgb[1]} ${rgb[2]} RG 0.8 w ${x1.toFixed(1)} ${y1.toFixed(1)} m ${x2.toFixed(1)} ${y2.toFixed(1)} l S`);
  };

  // Bandeau d'en-tête vert forêt (#173d2e)
  rect(0, 752, 595, 90, [0.09, 0.24, 0.18]);
  text(45, 798, 22, true, "Tal Agro Shop.", [1, 1, 1]);
  text(45, 777, 10, false, `Produits agricoles du Cameroun - Bafoussam, Ouest (${SHOP_PHONE_DISPLAY})`, [0.85, 0.94, 0.61]);
  text(400, 800, 12, true, "RECU DE COMMANDE", [1, 1, 1]);
  text(400, 782, 11, true, order.number, [0.85, 0.94, 0.61]);

  const dateStr = new Date(order.created_at).toLocaleString("fr-FR", { timeZone: "Africa/Douala" });
  text(45, 720, 10, true, "Date de commande :", [0.35, 0.4, 0.36]);
  text(155, 720, 10, false, dateStr);
  text(45, 704, 10, true, "Statut :", [0.35, 0.4, 0.36]);
  text(155, 704, 10, true, STATUS_LABELS[order.status], [0.18, 0.4, 0.29]);

  // Bloc client
  rect(45, 610, 505, 78, [0.93, 0.96, 0.91]);
  text(58, 668, 11, true, "INFORMATIONS DE LIVRAISON", [0.09, 0.24, 0.18]);
  text(58, 650, 10, false, `Client : ${order.full_name}`);
  text(58, 635, 10, false, `Telephone : ${order.phone}`);
  text(58, 620, 10, false, `Adresse : ${order.region} - ${order.address.slice(0, 75)}`);
  text(340, 650, 10, false, `Paiement : ${PAYMENT_LABELS[order.payment]}`);

  // En-tête du tableau des articles
  let y = 575;
  rect(45, y - 6, 505, 24, [0.09, 0.24, 0.18]);
  text(55, y, 10, true, "Article", [1, 1, 1]);
  text(310, y, 10, true, "Qte", [1, 1, 1]);
  text(365, y, 10, true, "Prix unitaire", [1, 1, 1]);
  text(465, y, 10, true, "Total", [1, 1, 1]);

  y -= 28;
  for (const item of order.order_items.slice(0, 18)) {
    const label = `${item.product_name} (${item.unit})`.slice(0, 46);
    text(55, y, 10, false, label);
    text(315, y, 10, false, String(item.quantity));
    text(365, y, 10, false, fcfa(item.unit_price));
    text(465, y, 10, true, fcfa(item.unit_price * item.quantity));
    line(45, y - 8, 550, y - 8);
    y -= 22;
  }

  // Totaux
  y -= 10;
  text(340, y, 10, false, "Sous-total articles :");
  text(460, y, 10, true, fcfa(order.subtotal));
  y -= 18;
  text(340, y, 10, false, "Livraison indicative :");
  text(460, y, 10, true, fcfa(order.shipping));
  y -= 24;
  rect(330, y - 7, 220, 26, [0.85, 0.94, 0.61]);
  text(340, y, 12, true, "TOTAL INDICATIF :", [0.09, 0.24, 0.18]);
  text(455, y, 12, true, fcfa(order.total), [0.09, 0.24, 0.18]);

  // Pied de page
  line(45, 95, 550, 95);
  text(45, 76, 9, false, "Aucun paiement n'est encaisse en ligne. La disponibilite et les frais de livraison sont confirmes", [0.35, 0.4, 0.36]);
  text(45, 63, 9, false, `par Tal Agro Shop au ${SHOP_PHONE_DISPLAY} avant tout transfert Mobile Money ou expedition.`, [0.35, 0.4, 0.36]);

  const stream = ops.join("\n");
  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj",
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj",
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj",
    `6 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += obj + "\n";
  }
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${offsets[i].toString().padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return new TextEncoder().encode(pdf);
}
