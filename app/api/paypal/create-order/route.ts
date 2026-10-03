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

const clean = (v: unknown, max = 300) => (typeof v === "string" ? v.trim().slice(0, max) : "")

/**
 * Optional delivery address sent by Apple Pay / Google Pay (the PayPal window collects
 * its own). Only accepted for the market's delivery countries.
 */
function readShipping(raw: any, allowedCountries: string[]) {
  if (!raw || typeof raw !== "object") return null
  const country = clean(raw.countryCode, 2).toUpperCase()
  const line1 = clean(raw.addressLine1)
  const city = clean(raw.city, 120)
  const postalCode = clean(raw.postalCode, 60)
  if (!allowedCountries.includes(country)) throw new CheckoutValidationError("SHIPPING_COUNTRY_NOT_SUPPORTED")
  if (!line1 || !city || !postalCode) throw new CheckoutValidationError("SHIPPING_ADDRESS_INVALID")
  return {
    type: "SHIPPING",
    name: { full_name: clean(raw.fullName, 300) || "Customer" },
    address: {
      address_line_1: line1,
      address_line_2: clean(raw.addressLine2) || undefined,
      admin_area_2: city,
      admin_area_1: clean(raw.region, 120) || undefined,
      postal_code: postalCode,
      country_code: country,
    },
  }
}

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

  const { currency, shippingCountries } = MARKETS[market]

  let shipping: ReturnType<typeof readShipping> = null
  try {
    shipping = readShipping(body?.shipping, shippingCountries)
  } catch (err) {
    const code = err instanceof Error ? err.message : "SHIPPING_ADDRESS_INVALID"
    console.warn("[PayPal] create-order rejected:", { market, reason: code })
    return NextResponse.json({ error: code }, { status: 400 })
  }
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
        ...(shipping ? { shipping } : {}),
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
    return NextResponse.json({ error: "Could not start payment. Please try again." }, { status: 502 })
  }
}
