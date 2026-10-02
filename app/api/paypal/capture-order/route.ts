import { type NextRequest, NextResponse } from "next/server"
import { finalizeOrder } from "@/lib/paypal/orders"
import { MARKETS } from "@/lib/paypal/catalog"
import { getClientIpFromHeaders, getUserAgentFromHeaders } from "@/lib/meta/cookies"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const ORDER_ID_RE = /^[A-Z0-9]{8,32}$/

/**
 * Called by the browser after the buyer approves the payment.
 * The server (not the browser) decides whether the order is paid.
 */
export async function POST(request: NextRequest) {
  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const orderId = typeof body?.orderId === "string" ? body.orderId : ""
  if (!ORDER_ID_RE.test(orderId)) return NextResponse.json({ error: "Invalid order" }, { status: 400 })

  try {
    const result = await finalizeOrder(orderId, {
      source: "client",
      sendPurchase: true,
      tracking: {
        fbc: request.cookies.get("_fbc")?.value,
        fbp: request.cookies.get("_fbp")?.value,
        clientIp: getClientIpFromHeaders(request.headers),
        userAgent: getUserAgentFromHeaders(request.headers),
        eventSourceUrl: typeof body?.pageUrl === "string" ? body.pageUrl.slice(0, 500) : undefined,
      },
    })

    const successPath = result.market ? MARKETS[result.market].successPath : null
    const redirectUrl =
      successPath && (result.status === "paid" || result.status === "pending") && !result.errorCode
        ? `${successPath}?paypal_order=${encodeURIComponent(orderId)}`
        : null

    return NextResponse.json(
      { status: result.status, errorCode: result.errorCode ?? null, redirectUrl },
      { status: result.status === "failed" ? 422 : 200 },
    )
  } catch (err) {
    console.error("[PayPal] capture-order error:", err instanceof Error ? err.message : err)
    return NextResponse.json({ status: "pending", errorCode: "PAYPAL_ERROR", redirectUrl: null }, { status: 502 })
  }
}
