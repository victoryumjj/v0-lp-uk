import { after, type NextRequest, NextResponse } from "next/server"
import { getTransaction, verifyPagouWebhook } from "@/lib/pagou/client"
import { sendPurchaseEventToAllPixels } from "@/lib/meta/sendEvent"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Pagou payment webhook — follows https://developer.pagou.ai/start-here/ai-integration
 *
 * - Validate the source: HMAC-SHA256 signature (X-Pagou-Signature / X-Pagou-Timestamp)
 * - ACK quickly with { "received": true }; process asynchronously (after the response)
 * - Deduplicate by the TOP-LEVEL event id (not the transaction id)
 * - Route payments by event="transaction" + data.event_type
 * - A signed transaction.paid IS the confirmation (webhook-confirmed state).
 *   GET /v2/transactions/{id} is used ONLY to reconcile when the event is incomplete.
 * - Meta Purchase (Conversions API) only for paid transactions, event_id = purchase_<transactionId>
 */

// Dedupe by top-level event id. Best effort per server instance (no database);
// Meta also deduplicates the Purchase by event_id, so a repeat cannot double count.
const seenEvents = new Map<string, number>()
function alreadySeen(id: string) {
  const now = Date.now()
  for (const [k, t] of seenEvents) if (now - t > 24 * 3600_000) seenEvents.delete(k)
  if (seenEvents.has(id)) return true
  seenEvents.set(id, now)
  return false
}

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
  if (alreadySeen(String(event.id))) return NextResponse.json({ received: true })

  after(() => processEvent(event))
  return NextResponse.json({ received: true })
}

async function processEvent(event: any) {
  try {
    if (event.event !== "transaction") {
      console.log("[Pagou Webhook] Ignored non-payment event:", { id: event.id, event: event.event, type: event.type })
      return
    }

    const data = event.data || {}
    const type: string = data.event_type || ""
    console.log("[Pagou Webhook]", type, {
      eventId: event.id,
      transactionId: data.id,
      status: data.status,
      amount: data.amount,
      currency: data.currency,
      correlationId: data.correlation_id,
    })

    switch (type) {
      case "transaction.paid":
        await handlePaid(data)
        return
      case "transaction.refunded":
      case "transaction.chargedback":
      case "transaction.cancelled":
        // State is logged for operations (no order database in this project)
        return
      default:
        return
    }
  } catch (err) {
    console.error("[Pagou Webhook] processing error:", err instanceof Error ? err.message : err)
  }
}

async function handlePaid(tx: any) {
  let amount: number | undefined = Number.isFinite(Number(tx.paid_amount)) && Number(tx.paid_amount) > 0
    ? Number(tx.paid_amount)
    : Number.isFinite(Number(tx.amount)) ? Number(tx.amount) : undefined
  let currency: string | undefined = tx.currency ? String(tx.currency).toUpperCase() : undefined
  let paidAt: string | undefined = tx.paid_at || undefined

  // Reconcile with GET only when the signed event is incomplete
  if (!tx.id) return
  if (tx.status !== "paid" || !amount || !currency) {
    try {
      const reconciled = await getTransaction(tx.id)
      if (reconciled.data.status !== "paid") {
        console.warn("[Pagou Webhook] Not paid after reconciliation:", { id: tx.id, status: reconciled.data.status })
        return
      }
      amount = reconciled.data.paid_amount || reconciled.data.amount
      currency = String(reconciled.data.currency || currency || "GBP").toUpperCase()
      paidAt = reconciled.data.paid_at || paidAt
    } catch (err) {
      console.error("[Pagou Webhook] Reconciliation failed:", { id: tx.id, error: err instanceof Error ? err.message : err })
      return
    }
  }

  const products: any[] = Array.isArray(tx.products) ? tx.products : []
  const [firstName, ...rest] = String(tx.customer?.name || "").trim().split(/\s+/)

  try {
    const results = await sendPurchaseEventToAllPixels({
      value: (amount ?? 0) / 100,
      currency: currency || "GBP",
      orderId: tx.id,
      eventId: `purchase_${tx.id}`,
      eventTime: paidAt ? Math.floor(new Date(paidAt).getTime() / 1000) : undefined,
      contentIds: products.map((p) => String(p.id)).filter(Boolean),
      contents: products.map((p) => ({
        id: String(p.id),
        quantity: Number(p.quantity) || 1,
        item_price: (Number(p.unit_price) || 0) / 100,
      })),
      email: tx.customer?.email || undefined,
      phone: tx.customer?.phone || undefined,
      firstName: firstName || undefined,
      lastName: rest.join(" ") || undefined,
      externalId: tx.id,
      fbc: tx.attribution?.fbc || undefined,
      fbp: tx.attribution?.fbp || undefined,
      eventSourceUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://www.slaturadecori.com",
    })
    console.log("[Pagou Webhook] Purchase sent to Meta:", results.map((r) => ({ pixelId: r.pixelId, ok: !r.result.error })))
  } catch (err) {
    console.error("[Pagou Webhook] Meta Purchase failed:", err instanceof Error ? err.message : err)
  }
}
