/**
 * @file api/commandes/[id]/pdf/route.ts
 * @description Route Handler servant le reçu de commande au format binaire PDF (`application/pdf`).
 * Protégé par `getOrder(id)` et Row Level Security (seul le client propriétaire ou un admin peut télécharger le PDF).
 */

import { NextResponse, type NextRequest } from "next/server";
import { getOrder } from "@/lib/auth";
import { buildOrderReceiptPdf } from "@/lib/pdf-receipt";

export async function GET(_request: NextRequest, { params }: RouteContext<"/api/commandes/[id]/pdf">) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) {
    return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });
  }

  const pdfBytes = buildOrderReceiptPdf(order);
  const filename = `Recu-${order.number}.pdf`;

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
