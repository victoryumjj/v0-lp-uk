import { type NextRequest, NextResponse } from "next/server"
import { CHECKOUT_SOURCE, getStripe, purchaseEventId } from "@/lib/stripe/server"
import { isMarket, productName } from "@/lib/checkout/catalog"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const SESSION_RE = /^cs_(test|live)_[A-Za-z0-9]{10,200}$/

/**
 * Read-only status used by the success page. Returns only what the page needs
 * (no address / phone). The browser fires Purchase pixels ONLY when status === "paid".
 */
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id") || ""
  if (!SESSION_RE.test(sessionId)) return NextResponse.json({ error: "Invalid session" }, { status: 400 })

  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId)
    if (session.metadata?.source !== CHECKOUT_SOURCE) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const status =
      session.payment_status === "paid" || session.payment_status === "no_payment_required"
        ? "paid"
        : session.status === "expired"
          ? "cancelled"
          : "pending"

    let items: Array<[string, number, number]> = []
    try {
      items = JSON.parse(session.metadata?.items || "[]")
    } catch {}
    const market = session.metadata?.market
    const nameOf = (id: string) => (isMarket(market) ? productName(market, id) : id)
    const fullName = (session.customer_details?.name || "").trim().split(/\s+/)

    return NextResponse.json(
      {
        orderId: session.id,
        status,
        currency: (session.currency || "gbp").toUpperCase(),
        amount_total: session.amount_total ?? 0,
        value: (session.amount_total ?? 0) / 100,
        eventId: purchaseEventId(session.id),
        customerEmail: session.customer_details?.email ?? null,
        firstName: fullName[0] || null,
        lastName: fullName.slice(1).join(" ") || null,
        lineItems: items.map(([id, qty, cents]) => ({
          id,
          name: nameOf(id),
          quantity: qty,
          unitPrice: cents / 100,
          amount: (cents * qty) / 100,
        })),
      },
      { headers: { "Cache-Control": "no-store" } },
    )
  } catch (err: any) {
    if (err?.statusCode === 404) return NextResponse.json({ error: "Order not found" }, { status: 404 })
    console.error("[Stripe] session-status error:", err?.message)
    return NextResponse.json({ error: "Temporarily unavailable" }, { status: 502 })
  }
}
