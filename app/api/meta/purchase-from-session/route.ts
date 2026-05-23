import { type NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { sendPurchaseEventToAllPixels } from "@/lib/meta/sendEvent"
import { getClientIpFromHeaders, getUserAgentFromHeaders } from "@/lib/meta/cookies"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const { session_id } = await request.json()

    if (!session_id) {
      return NextResponse.json(
        { error: "session_id is required" },
        { status: 400 }
      )
    }

    console.log("[Meta Purchase] Retrieving Stripe session:", session_id)

    // Retrieve Stripe session with line items
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["line_items", "customer_details"],
    })

    // Extract data
    const amount_total = session.amount_total || 0
    const currency = (session.currency || "gbp").toUpperCase()
    const value = Math.round((amount_total / 100) * 100) / 100

    // Customer details from Stripe
    const customerDetails = session.customer_details
    const shippingDetails = session.shipping_details
    const email = customerDetails?.email || ""
    const phone = customerDetails?.phone || shippingDetails?.phone || ""

    // Extract tracking data from session metadata
    const metadata = session.metadata || {}
    const fbc = metadata.fbc || undefined
    const fbp = metadata.fbp || undefined
    const purchaseEventId = metadata.purchase_event_id || `purchase_${session_id}`
    const eventSourceUrl = metadata.event_source_url || process.env.NEXT_PUBLIC_SITE_URL || "https://www.woodslat.shop"

    // Extract content_ids and contents from metadata
    let contentIds: string[] = []
    let contents: Array<{ id: string; quantity: number; item_price?: number }> = []
    
    try {
      if (metadata.content_ids) {
        contentIds = JSON.parse(metadata.content_ids)
      }
    } catch (e) {
      console.warn("[Meta Purchase] Could not parse content_ids:", e)
    }

    try {
      if (metadata.contents) {
        const rawContents = JSON.parse(metadata.contents)
        contents = rawContents.map((c: any) => ({
          id: c.id,
          quantity: c.quantity || 1,
          item_price: c.price || 0,
        }))
      }
    } catch (e) {
      console.warn("[Meta Purchase] Could not parse contents:", e)
    }

    // If no contents from metadata, build from line items
    if (contents.length === 0 && session.line_items?.data) {
      contents = session.line_items.data.map((item, idx) => ({
        id: contentIds[idx] || `item_${idx}`,
        quantity: item.quantity || 1,
        item_price: item.amount_total ? (item.amount_total / 100) / (item.quantity || 1) : 0,
      }))
    }

    // Get client IP and UA from the current request (fallback to metadata)
    const clientIp = metadata.client_ip || getClientIpFromHeaders(request.headers)
    const clientUserAgent = metadata.client_user_agent || getUserAgentFromHeaders(request.headers)

    // Get name from shipping details
    const firstName = shippingDetails?.name?.split(" ")[0] || undefined
    const lastName = shippingDetails?.name?.split(" ").slice(1).join(" ") || undefined

    console.log("[Meta Purchase] Sending Purchase to Meta CAPI:", {
      value,
      currency,
      event_id: purchaseEventId,
      has_fbc: !!fbc,
      has_fbp: !!fbp,
      has_email: !!email,
      has_phone: !!phone,
      content_ids_count: contentIds.length,
      contents_count: contents.length,
      has_ip: !!clientIp,
      has_ua: !!clientUserAgent,
    })

    // Send Purchase event to ALL Meta Pixels via Conversions API
    const results = await sendPurchaseEventToAllPixels({
      value,
      currency,
      orderId: session_id,
      contentIds,
      contents,
      eventId: purchaseEventId,
      eventSourceUrl,
      eventTime: Math.floor(session.created),
      // User data
      email: email || undefined,
      phone: phone || undefined,
      firstName,
      lastName,
      city: shippingDetails?.address?.city || undefined,
      state: shippingDetails?.address?.state || undefined,
      zip: shippingDetails?.address?.postal_code || undefined,
      country: shippingDetails?.address?.country || undefined,
      // Attribution
      fbc,
      fbp,
      clientIpAddress: clientIp,
      clientUserAgent: clientUserAgent,
    })

    const successCount = results.filter(r => r.result.events_received && r.result.events_received > 0).length
    console.log("[Meta Purchase] Results:", {
      total_pixels: results.length,
      successful: successCount,
      pixels: results.map(r => ({ pixelId: r.pixelId, received: r.result.events_received })),
    })

    return NextResponse.json({
      ok: true,
      pixels_sent: results.length,
      successful: successCount,
      results: results.map(r => ({
        pixelId: r.pixelId,
        events_received: r.result.events_received,
        fbtrace_id: r.result.fbtrace_id,
      })),
      event_id: purchaseEventId,
    })
  } catch (error) {
    console.error("[Meta Purchase] Error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 500 }
    )
  }
}
