import "server-only"

import { sendPurchaseEventToAllPixels } from "@/lib/meta/sendEvent"
import {
  capturePayPalOrder,
  getPayPalOrder,
  PayPalApiError,
  type PayPalOrder,
} from "./client"
import { MARKETS, validatePayPalOrder, type Market } from "./catalog"

/** Order states exposed by this integration (no database yet: PayPal is the record). */
export type OrderStatus = "pending" | "paid" | "failed" | "cancelled" | "refunded"

export function purchaseEventId(orderId: string) {
  // Same id on server (CAPI) and browser (Pixel) → Meta deduplicates
  return `purchase_${orderId}`
}

export function mapOrderStatus(order: PayPalOrder): OrderStatus {
  if (order.status === "VOIDED") return "cancelled"
  const capture = order.purchase_units?.[0]?.payments?.captures?.[0]
  if (!capture) return "pending"
  switch (capture.status) {
    case "COMPLETED":
      return "paid"
    case "PENDING":
      return "pending"
    case "REFUNDED":
    case "PARTIALLY_REFUNDED":
      return "refunded"
    case "DECLINED":
    case "FAILED":
      return "failed"
    default:
      return "pending"
  }
}

export interface TrackingContext {
  fbc?: string
  fbp?: string
  clientIp?: string
  userAgent?: string
  eventSourceUrl?: string
}

export interface FinalizeResult {
  status: OrderStatus
  orderId: string
  market?: Market
  errorCode?:
    | "NOT_FOUND"
    | "NOT_APPROVED"
    | "INVALID_ORDER"
    | "SHIPPING_COUNTRY_NOT_SUPPORTED"
    | "SHIPPING_ADDRESS_MISSING"
    | "INSTRUMENT_DECLINED"
    | "PAYPAL_ERROR"
  order?: PayPalOrder
}

/**
 * Validates and captures an approved PayPal order. Safe to call more than once
 * (client onApprove + CHECKOUT.ORDER.APPROVED webhook): the capture uses a
 * deterministic PayPal-Request-Id and already-captured orders are only read.
 */
export async function finalizeOrder(
  orderId: string,
  opts: { sendPurchase: boolean; tracking?: TrackingContext; source: "client" | "webhook" },
): Promise<FinalizeResult> {
  let order: PayPalOrder
  try {
    order = await getPayPalOrder(orderId)
  } catch (err) {
    if (err instanceof PayPalApiError && err.status === 404) return { status: "failed", orderId, errorCode: "NOT_FOUND" }
    throw err
  }

  const validation = validatePayPalOrder(order)
  if (!validation.ok) {
    console.warn("[PayPal] Order rejected by catalog validation:", { orderId, reason: validation.reason, source: opts.source })
    return { status: "failed", orderId, errorCode: "INVALID_ORDER" }
  }
  const market = validation.market

  // Already captured (double click, refresh, webhook arrived first…)
  if (order.status === "COMPLETED") {
    return { status: mapOrderStatus(order), orderId, market, order }
  }

  if (order.status !== "APPROVED") {
    return { status: order.status === "VOIDED" ? "cancelled" : "pending", orderId, market, errorCode: "NOT_APPROVED" }
  }

  // Shipping destination must be one we deliver to (same delivery countries as before)
  const country = order.purchase_units[0].shipping?.address?.country_code
  if (!country) {
    console.warn("[PayPal] Approved order without shipping address:", { orderId })
    return { status: "failed", orderId, market, errorCode: "SHIPPING_ADDRESS_MISSING" }
  }
  if (!MARKETS[market].shippingCountries.includes(country)) {
    console.warn("[PayPal] Shipping country not supported:", { orderId, country, market })
    return { status: "failed", orderId, market, errorCode: "SHIPPING_COUNTRY_NOT_SUPPORTED" }
  }

  let captured: PayPalOrder
  try {
    captured = await capturePayPalOrder(orderId)
  } catch (err) {
    if (err instanceof PayPalApiError) {
      if (err.issue === "ORDER_ALREADY_CAPTURED") {
        const fresh = await getPayPalOrder(orderId)
        return { status: mapOrderStatus(fresh), orderId, market, order: fresh }
      }
      if (err.issue === "INSTRUMENT_DECLINED") {
        return { status: "failed", orderId, market, errorCode: "INSTRUMENT_DECLINED" }
      }
      console.error("[PayPal] Capture failed:", { orderId, status: err.status, issue: err.issue, debugId: err.debugId })
      return { status: "failed", orderId, market, errorCode: "PAYPAL_ERROR" }
    }
    throw err
  }

  const status = mapOrderStatus(captured)
  console.log("[PayPal] Order captured:", {
    orderId,
    market,
    status,
    captureId: captured.purchase_units?.[0]?.payments?.captures?.[0]?.id,
    amount: captured.purchase_units?.[0]?.payments?.captures?.[0]?.amount,
    source: opts.source,
  })

  if (status === "paid" && opts.sendPurchase) {
    await sendServerPurchase(captured, opts.tracking)
  }

  return { status, orderId, market, order: captured }
}

/** Meta Conversions API Purchase — only ever called for a capture that PayPal reported COMPLETED. */
export async function sendServerPurchase(order: PayPalOrder, tracking?: TrackingContext) {
  try {
    const unit = order.purchase_units?.[0]
    const capture = unit?.payments?.captures?.[0]
    if (!unit || capture?.status !== "COMPLETED") return

    const value = Number(capture.amount?.value ?? unit.amount.value)
    const currency = (capture.amount?.currency_code ?? unit.amount.currency_code).toUpperCase()
    const items = unit.items || []
    const address = unit.shipping?.address
    const eventTime = capture.create_time ? Math.floor(new Date(capture.create_time).getTime() / 1000) : undefined

    const results = await sendPurchaseEventToAllPixels({
      value,
      currency,
      orderId: order.id,
      eventId: purchaseEventId(order.id),
      eventTime,
      contentIds: items.map((i) => i.sku || "").filter(Boolean),
      contents: items.map((i) => ({ id: i.sku || "", quantity: Number(i.quantity), item_price: Number(i.unit_amount.value) })),
      email: order.payer?.email_address,
      phone: order.payer?.phone?.phone_number?.national_number,
      firstName: order.payer?.name?.given_name,
      lastName: order.payer?.name?.surname,
      city: address?.admin_area_2,
      state: address?.admin_area_1,
      zip: address?.postal_code,
      country: address?.country_code,
      externalId: order.payer?.payer_id,
      fbc: tracking?.fbc,
      fbp: tracking?.fbp,
      clientIpAddress: tracking?.clientIp,
      clientUserAgent: tracking?.userAgent,
      eventSourceUrl: tracking?.eventSourceUrl || process.env.NEXT_PUBLIC_SITE_URL,
    })

    console.log(
      "[PayPal] Purchase sent to Meta CAPI:",
      results.map((r) => ({ pixelId: r.pixelId, ok: !r.result.error })),
    )
  } catch (err) {
    // Tracking must never break the payment flow
    console.error("[PayPal] Failed to send Purchase to Meta:", err instanceof Error ? err.message : err)
  }
}
