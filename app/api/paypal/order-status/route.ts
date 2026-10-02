import { type NextRequest, NextResponse } from "next/server"
import { getPayPalOrder, PayPalApiError } from "@/lib/paypal/client"
import { validatePayPalOrder } from "@/lib/paypal/catalog"
import { mapOrderStatus, purchaseEventId } from "@/lib/paypal/orders"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const ORDER_ID_RE = /^[A-Z0-9]{8,32}$/

/**
 * Read-only status used by the success page. Returns only what the page needs
 * (no address / phone). The browser fires Purchase pixels ONLY when status === "paid".
 */
export async function GET(request: NextRequest) {
  const orderId = request.nextUrl.searchParams.get("order_id") || ""
  if (!ORDER_ID_RE.test(orderId)) return NextResponse.json({ error: "Invalid order" }, { status: 400 })

  try {
    const order = await getPayPalOrder(orderId)
    const validation = validatePayPalOrder(order)
    if (!validation.ok) return NextResponse.json({ error: "Order not found" }, { status: 404 })

    const unit = order.purchase_units[0]
    const capture = unit.payments?.captures?.[0]
    const amount = capture?.amount ?? unit.amount
    const status = mapOrderStatus(order)

    return NextResponse.json({
      orderId,
      status,
      currency: amount.currency_code,
      amount_total: Math.round(Number(amount.value) * 100),
      value: Number(amount.value),
      eventId: purchaseEventId(orderId),
      customerEmail: order.payer?.email_address ?? null,
      firstName: order.payer?.name?.given_name ?? null,
      lastName: order.payer?.name?.surname ?? null,
      lineItems: (unit.items || []).map((i) => ({
        id: i.sku,
        name: i.name,
        quantity: Number(i.quantity),
        unitPrice: Number(i.unit_amount.value),
        amount: Math.round(Number(i.unit_amount.value) * Number(i.quantity) * 100) / 100,
      })),
    }, { headers: { "Cache-Control": "no-store" } })
  } catch (err) {
    if (err instanceof PayPalApiError && err.status === 404) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }
    console.error("[PayPal] order-status error:", err instanceof Error ? err.message : err)
    return NextResponse.json({ error: "Temporarily unavailable" }, { status: 502 })
  }
}
