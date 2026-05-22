import { type NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { sendPurchaseEventToAllPixels } from "@/lib/meta/sendEvent"
import type Stripe from "stripe"

/**
 * Stripe Webhook Handler
 * Processes checkout.session.completed and payment_intent.succeeded events
 * Sends Purchase event to Meta Conversions API with proper attribution data
 */
export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error) {
    console.error("[Stripe Webhook] Signature verification failed:", error)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        
        console.log("[Stripe Webhook] Checkout completed:", {
          session_id: session.id,
          payment_status: session.payment_status,
          amount: session.amount_total,
          currency: session.currency,
        })

        // Only send Purchase event if payment is complete
        if (session.payment_status === "paid") {
          await handlePurchaseEvent(session)
        }
        break
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        
        console.log("[Stripe Webhook] Payment succeeded:", {
          payment_intent_id: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
        })

        // If using PaymentIntents directly (not Checkout Sessions)
        // Check metadata for tracking data
        if (paymentIntent.metadata?.send_purchase_event === "true") {
          await handlePaymentIntentPurchase(paymentIntent)
        }
        break
      }

      case "checkout.session.async_payment_succeeded": {
        // For delayed payment methods (bank transfers, etc.)
        const session = event.data.object as Stripe.Checkout.Session
        
        console.log("[Stripe Webhook] Async payment succeeded:", session.id)
        await handlePurchaseEvent(session)
        break
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log("[Stripe Webhook] Payment failed:", {
          payment_intent_id: paymentIntent.id,
          error: paymentIntent.last_payment_error?.message,
        })
        break
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[Stripe Webhook] Processing error:", error)
    // Return 200 to acknowledge receipt even if processing fails
    // This prevents Stripe from retrying unnecessarily
    return NextResponse.json({ received: true, warning: "Processing error logged" })
  }
}

/**
 * Handle Purchase event from Checkout Session
 */
async function handlePurchaseEvent(session: Stripe.Checkout.Session) {
  try {
    // Retrieve full session with line items and customer details
    const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ["line_items", "customer_details"],
    })

    // Extract tracking data from metadata
    const metadata = fullSession.metadata || {}
    const fbc = metadata.fbc || undefined
    const fbp = metadata.fbp || undefined
    // IMPORTANT: Use purchase_event_id (not event_id which is for checkout)
    // This must match the eventId used by purchase-from-session and the client-side fbq() call
    const eventId = metadata.purchase_event_id || metadata.event_id || `purchase_${session.id}`
    const contentIds = metadata.content_ids ? JSON.parse(metadata.content_ids) : []

    // Get customer details
    const customerDetails = fullSession.customer_details
    const shippingDetails = fullSession.shipping_details

    // Calculate value (Stripe amounts are in cents)
    const value = (fullSession.amount_total || 0) / 100
    const currency = (fullSession.currency || "usd").toUpperCase()

    console.log("[Stripe Webhook] Sending Purchase to Meta:", {
      value,
      currency,
      order_id: session.id,
      event_id: eventId,
      has_fbc: !!fbc,
      has_fbp: !!fbp,
      has_email: !!customerDetails?.email,
      content_ids_count: contentIds.length,
      is_free_product: value === 0,
    })

    // Send Purchase event to Meta Pixel
    const results = await sendPurchaseEventToAllPixels({
      value,
      currency,
      orderId: session.id,
      contentIds,
      eventId,
      eventSourceUrl: metadata.event_source_url || undefined,
      // ✓ FIXED: Use Stripe's created timestamp (not webhook receive time)
      eventTime: Math.floor(session.created),
      // User data
      email: customerDetails?.email || undefined,
      phone: customerDetails?.phone || shippingDetails?.phone || undefined,
      firstName: shippingDetails?.name?.split(" ")[0] || undefined,
      lastName: shippingDetails?.name?.split(" ").slice(1).join(" ") || undefined,
      city: shippingDetails?.address?.city || undefined,
      state: shippingDetails?.address?.state || undefined,
      zip: shippingDetails?.address?.postal_code || undefined,
      country: shippingDetails?.address?.country || undefined,
      // Attribution cookies
      fbc,
      fbp,
      // IP and UA from metadata (captured at checkout initiation)
      clientIpAddress: metadata.client_ip || undefined,
      clientUserAgent: metadata.client_user_agent || undefined,
    })

    console.log("[Stripe Webhook] Purchase events sent to all pixels:", results.map(r => ({ pixelId: r.pixelId, success: !r.result.error })))
  } catch (error) {
    console.error("[Stripe Webhook] Failed to send Purchase event:", {
      error: error instanceof Error ? error.message : String(error),
      session_id: session.id,
      stack: error instanceof Error ? error.stack : undefined,
    })
    // Don't throw - we don't want to fail the webhook for tracking issues
  }
}

/**
 * Handle Purchase event from PaymentIntent (for custom integrations)
 */
async function handlePaymentIntentPurchase(paymentIntent: Stripe.PaymentIntent) {
  try {
    const metadata = paymentIntent.metadata || {}
    
    const value = paymentIntent.amount / 100
    const currency = paymentIntent.currency.toUpperCase()
    const contentIds = metadata.content_ids ? JSON.parse(metadata.content_ids) : []

    console.log("[Stripe Webhook] Sending PaymentIntent Purchase to Meta:", {
      value,
      currency,
      payment_intent_id: paymentIntent.id,
    })

    const results = await sendPurchaseEventToAllPixels({
      value,
      currency,
      orderId: paymentIntent.id,
      contentIds,
      eventId: metadata.event_id || `purchase_${paymentIntent.id}`,
      eventSourceUrl: metadata.event_source_url || undefined,
      // ✓ FIXED: Use PaymentIntent created timestamp
      eventTime: Math.floor(paymentIntent.created),
      email: metadata.customer_email || undefined,
      phone: metadata.customer_phone || undefined,
      fbc: metadata.fbc || undefined,
      fbp: metadata.fbp || undefined,
      clientIpAddress: metadata.client_ip || undefined,
      clientUserAgent: metadata.client_user_agent || undefined,
    })

    console.log("[Stripe Webhook] PaymentIntent Purchase events sent to all pixels:", results.map(r => ({ pixelId: r.pixelId, success: !r.result.error })))
  } catch (error) {
    console.error("[Stripe Webhook] Failed to send PaymentIntent Purchase:", {
      error: error instanceof Error ? error.message : String(error),
      payment_intent_id: paymentIntent.id,
      stack: error instanceof Error ? error.stack : undefined,
    })
  }
}
