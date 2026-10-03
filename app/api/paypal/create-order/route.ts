import { type NextRequest, NextResponse } from "next/server"
import { createPayPalOrder, PayPalApiError } from "@/lib/paypal/client"
import {
  centsToValue,
  CheckoutValidationError,
  isMarket,
  MARKETS,
  totalCents,
  validateRequestedItems,
} from "@/lib/paypal/catalog"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function readUtms(request: NextRequest): Record<string, string> {
  try {
    const raw = request.cookies.get("_utm_data")?.value
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

/**
 * Creates the PayPal order. The browser only sends product ids, quantities and the
 * unit price it displayed; the server checks that price against the catalog and
 * builds the amount itself. A tampered price is rejected.
 */
export async function POST(request: NextRequest) {
  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const market = body?.market
  if (!isMarket(market)) return NextResponse.json({ error: "Invalid market" }, { status: 400 })

  let lines
  try {
    lines = validateRequestedItems(market, body?.items)
  } catch (err) {
    if (err instanceof CheckoutValidationError) {
      console.warn("[PayPal] create-order rejected:", { market, reason: err.message })
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    throw err
  }

  const { currency } = MARKETS[market]
  const total = centsToValue(totalCents(lines))
  const utms = readUtms(request)

  // custom_id (max 127 chars) keeps a compact attribution trail visible in PayPal
  const customId = [market, utms.utm_source, utms.utm_campaign, utms.utm_content]
    .map((v) => (v || "").replace(/\|/g, "/"))
    .join("|")
    .slice(0, 127)

  const orderBody = {
    intent: "CAPTURE",
    purchase_units: [
      {
        reference_id: market,
        custom_id: customId,
        amount: {
          currency_code: currency,
          value: total,
          breakdown: {
            item_total: { currency_code: currency, value: total },
            shipping: { currency_code: currency, value: "0.00" }, // free delivery, as in the previous checkout
          },
        },
        items: lines.map((l) => ({
          name: l.name.slice(0, 127),
          sku: l.id,
          quantity: String(l.quantity),
          unit_amount: { currency_code: currency, value: centsToValue(l.unitCents) },
          category: "PHYSICAL_GOODS",
        })),
      },
    ],
  }

  try {
    const order = await createPayPalOrder(orderBody, crypto.randomUUID())
    console.log("[PayPal] Order created:", { orderId: order.id, market, total, currency, utms })
    return NextResponse.json({ orderId: order.id })
  } catch (err) {
    const info = err instanceof PayPalApiError ? { status: err.status, issue: err.issue, debugId: err.debugId } : String(err)
    console.error("[PayPal] create-order failed:", info)
    // The PayPal error code (no secrets) is returned so the cause is visible on screen
    const code =
      err instanceof PayPalApiError ? err.issue || `HTTP_${err.status}` : "NETWORK_ERROR"
    const ref = err instanceof PayPalApiError ? err.debugId : undefined
    return NextResponse.json(
      { error: "Could not start payment. Please try again.", code, ref },
      { status: 502 },
    )
  }
}
