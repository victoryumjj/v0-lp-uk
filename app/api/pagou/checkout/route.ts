import { type NextRequest, NextResponse } from "next/server"
import { createCheckoutLink, PagouApiError } from "@/lib/pagou/client"
import { CheckoutValidationError, isMarket, MARKETS, validateRequestedItems } from "@/lib/paypal/catalog"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]

/**
 * Creates a Pagou hosted checkout link for the cart.
 * Prices come from the SERVER catalog (lib/paypal/catalog.ts); a tampered price is rejected.
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
    if (err instanceof CheckoutValidationError) return NextResponse.json({ error: err.message }, { status: 400 })
    throw err
  }

  const currency = MARKETS[market].currency
  try {
    const link = await createCheckoutLink({
      title: "Slatura Wood order",
      currency,
      products: lines.map((l) => ({
        // external_id is upserted by Pagou: id + unit price keeps each price variant separate
        external_id: `${l.id}-${l.unitCents}`,
        name: l.name.slice(0, 255),
        price: l.unitCents,
        quantity: l.quantity,
        currency,
        type: "physical" as const,
      })),
    })

    // Forward campaign UTMs so Pagou can attribute the sale (echoed in the webhook "attribution")
    const url = new URL(link.data.url)
    try {
      const utms = JSON.parse(request.cookies.get("_utm_data")?.value || "{}")
      for (const k of UTM_KEYS) if (utms[k] && !url.searchParams.has(k)) url.searchParams.set(k, String(utms[k]))
      const fbclid = utms.fbclid
      if (fbclid && !url.searchParams.has("fbclid")) url.searchParams.set("fbclid", String(fbclid))
    } catch {}

    console.log("[Pagou] Checkout link created:", { market, currency, requestId: link.requestId })
    return NextResponse.json({ url: url.toString() })
  } catch (err) {
    const info = err instanceof PagouApiError ? { status: err.status, code: err.code, requestId: err.requestId } : String(err)
    console.error("[Pagou] checkout link failed:", info)
    const code = err instanceof PagouApiError ? err.code || `HTTP_${err.status}` : "NETWORK_ERROR"
    return NextResponse.json({ error: "Could not start payment. Please try again.", code }, { status: 502 })
  }
}
