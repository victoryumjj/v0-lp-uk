import { after, type NextRequest, NextResponse } from "next/server"
import { getTransaction, verifyPagouWebhook } from "@/lib/pagou/client"
import { sendPurchaseEventToAllPixels } from "@/lib/meta/sendEvent"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Pagou payment webhook (Settings → Integrations → Webhooks, with a Security Token).
 * - Signature verified (HMAC-SHA256, X-Pagou-Signature / X-Pagou-Timestamp)
 * - Paid state reconciled with GET /v2/transactions/{id} before acting
 * - Meta Purchase (Conversions API) sent ONLY for confirmed paid transactions,
 *   event_id = purchase_<transactionId> (Meta deduplicates repeated deliveries)
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text()

  if (!verifyPagouWebhook(request.headers, rawBody)) {
    console.warn("[Pagou Webhook] Invalid or missing signature — ignored")
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 })
  }

  let event: any
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 })
  }
  if (!event?.id) return NextResponse.json({ error: "missing_event_id" }, { status: 400 })

  const type: string = event?.data?.event_type || ""
  const tx = event?.data || {}

  // Respond fast; process after the response
  after(async () => {
    try {
      if (event.event !== "transaction") return
      console.log("[Pagou Webhook]", type, { eventId: event.id, transactionId: tx.id, status: tx.status, amount: tx.amount, currency: tx.currency })

      if (type !== "transaction.paid") return

      // Never trust the payload alone: confirm with the API
      const confirmed = await getTransaction(tx.id)
      if (confirmed.data.status !== "paid") {
        console.warn("[Pagou Webhook] transaction.paid not confirmed by API:", { id: tx.id, status: confirmed.data.status })
        return
      }

      const amount = confirmed.data.paid_amount || confirmed.data.amount
      const currency = String(confirmed.data.currency || tx.currency || "GBP").toUpperCase()
      const products: any[] = Array.isArray(tx.products) ? tx.products : []
      const [firstName, ...rest] = String(tx.customer?.name || "").trim().split(/\s+/)

      const results = await sendPurchaseEventToAllPixels({
        value: amount / 100,
        currency,
        orderId: tx.id,
        eventId: `purchase_${tx.id}`,
        eventTime: confirmed.data.paid_at ? Math.floor(new Date(confirmed.data.paid_at).getTime() / 1000) : undefined,
        contentIds: products.map((p) => String(p.id)).filter(Boolean),
        contents: products.map((p) => ({ id: String(p.id), quantity: Number(p.quantity) || 1, item_price: (Number(p.unit_price) || 0) / 100 })),
        email: tx.customer?.email || undefined,
        phone: tx.customer?.phone || undefined,
        firstName: firstName || undefined,
        lastName: rest.join(" ") || undefined,
        country: "GB",
        externalId: tx.id,
        fbc: tx.attribution?.fbc || undefined,
        fbp: tx.attribution?.fbp || undefined,
        eventSourceUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://www.slaturadecori.com",
      })
      console.log("[Pagou Webhook] Purchase sent to Meta:", results.map((r) => ({ pixelId: r.pixelId, ok: !r.result.error })))
    } catch (err) {
      console.error("[Pagou Webhook] processing error:", err instanceof Error ? err.message : err)
    }
  })

  return NextResponse.json({ received: true })
}
