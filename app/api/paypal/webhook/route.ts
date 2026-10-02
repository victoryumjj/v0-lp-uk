import { type NextRequest, NextResponse } from "next/server"
import { getPayPalOrder, verifyPayPalWebhook } from "@/lib/paypal/client"
import { validatePayPalOrder } from "@/lib/paypal/catalog"
import { finalizeOrder, mapOrderStatus, sendServerPurchase } from "@/lib/paypal/orders"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const STATUS_BY_EVENT: Record<string, string> = {
  "PAYMENT.CAPTURE.PENDING": "pending",
  "PAYMENT.CAPTURE.DENIED": "failed",
  "PAYMENT.CAPTURE.REFUNDED": "refunded",
  "PAYMENT.CAPTURE.REVERSED": "refunded",
}

/**
 * PayPal webhook. Every event is signature-verified with PayPal before use.
 *
 * Subscribe to: CHECKOUT.ORDER.APPROVED, PAYMENT.CAPTURE.COMPLETED,
 * PAYMENT.CAPTURE.PENDING, PAYMENT.CAPTURE.DENIED, PAYMENT.CAPTURE.REFUNDED,
 * PAYMENT.CAPTURE.REVERSED
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text()

  const verified = await verifyPayPalWebhook(request.headers, rawBody)
  if (!verified) {
    console.warn("[PayPal Webhook] Invalid signature — event ignored")
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  let event: any
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  const type: string = event?.event_type || ""
  const resource = event?.resource || {}

  try {
    switch (type) {
      // Buyer approved but may have closed the page before the browser captured:
      // capture from the server so the sale is never lost.
      case "CHECKOUT.ORDER.APPROVED": {
        if (typeof resource.id !== "string") break
        const result = await finalizeOrder(resource.id, { source: "webhook", sendPurchase: false })
        console.log("[PayPal Webhook] ORDER.APPROVED handled:", {
          orderId: resource.id,
          status: result.status,
          errorCode: result.errorCode,
        })
        break
      }

      case "PAYMENT.CAPTURE.COMPLETED": {
        const orderId: string | undefined = resource?.supplementary_data?.related_ids?.order_id
        if (!orderId) break
        const order = await getPayPalOrder(orderId)
        const validation = validatePayPalOrder(order)
        if (!validation.ok) {
          console.warn("[PayPal Webhook] CAPTURE.COMPLETED for an order that failed validation:", {
            orderId,
            reason: validation.reason,
          })
          break
        }
        console.log("[PayPal Webhook] PAID:", { orderId, captureId: resource.id, amount: resource.amount })
        // Same event_id as the capture route → Meta deduplicates if both arrive
        if (mapOrderStatus(order) === "paid") await sendServerPurchase(order)
        break
      }

      case "PAYMENT.CAPTURE.PENDING":
      case "PAYMENT.CAPTURE.DENIED":
      case "PAYMENT.CAPTURE.REFUNDED":
      case "PAYMENT.CAPTURE.REVERSED": {
        console.log(`[PayPal Webhook] ${STATUS_BY_EVENT[type].toUpperCase()}:`, {
          captureId: resource.id,
          orderId: resource?.supplementary_data?.related_ids?.order_id,
          amount: resource.amount,
          reason: resource.status_details?.reason,
        })
        break
      }

      default:
        console.log("[PayPal Webhook] Unhandled event:", type)
    }
  } catch (err) {
    // Non-2xx makes PayPal retry, which is what we want for transient errors
    console.error("[PayPal Webhook] Processing error:", { type, error: err instanceof Error ? err.message : err })
    return NextResponse.json({ error: "Processing error" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
