"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { CheckCircle, Package, RotateCcw, ShoppingCart, Star } from "lucide-react"
import { trackPurchase, identifyUser, trackEventWithUser } from "@/lib/tiktok-events"
import { updateMetaUserData } from "@/lib/meta-pixel"
import { useCart } from "@/lib/cart-context"

declare global {
  interface Window {
    fbq?: (...args: any[]) => void
    gtag?: (...args: any[]) => void
  }
}

// LED upsell product for UK
const LED_UPSELL = {
  id: "prod_RbJWvSQ5LGC",
  slug: "recessed-led-strip-lighting",
  name: "Recessed LED Strip Kit",
  description: "Perfect with your acoustic panel, premium integrated lighting",
  price: 42.00,
  image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/LED0101-NcQN4b3GARfX7EQhQSIcnMbQB9NsFa.jpg",
}

export default function SuccessUKClient({ sessionId }: { sessionId: string | null }) {
  const firedRef = useRef(false)
  const { clearCart } = useCart()
  const [purchaseData, setPurchaseData] = useState<any>(null)

  useEffect(() => {
    if (!sessionId || firedRef.current) return
    firedRef.current = true
    clearCart()

    // Clear pre-checkout data after success
    try {
      sessionStorage.removeItem("checkout_order_uk")
      sessionStorage.removeItem("checkout_bonus_uk")
    } catch (e) {
      // ignore
    }

    ;(async () => {
      try {
        // 1) Fetch session details
        let sessionData: any = null
        const sessionRes = await fetch(`/api/stripe/session?session_id=${sessionId}`)
        if (sessionRes.ok) {
          sessionData = await sessionRes.json()
          setPurchaseData(sessionData)
          
          // Update Meta Pixel with user data for Advanced Matching (immediate + future page loads)
          const customerDetailsMeta = sessionData?.customer_details
          if (customerDetailsMeta) {
            let firstName: string | undefined
            let lastName: string | undefined
            if (customerDetailsMeta.name) {
              const nameParts = customerDetailsMeta.name.trim().split(' ')
              if (nameParts.length >= 1) firstName = nameParts[0]
              if (nameParts.length >= 2) lastName = nameParts[nameParts.length - 1]
            }
            
            // This updates the pixel immediately AND saves to localStorage for future visits
            updateMetaUserData({
              email: customerDetailsMeta.email || undefined,
              phone: customerDetailsMeta.phone || undefined,
              firstName,
              lastName,
              externalId: sessionId || undefined,
            })
          }
        }

        // 2) Meta Purchase - Dispara via API server-side (Conversions API)
        // IMPORTANTE: O webhook do Stripe pode não estar configurado, então disparamos via API
        const sessionValue = sessionData ? (sessionData.amount_total || 0) / 100 : 0
        const sessionCurrency = "GBP"
        const purchaseEventId = sessionData?.metadata?.purchase_event_id || `purchase_${sessionId}`
        
        // Chamar API server-side para enviar Purchase via Meta Conversions API
        try {
          console.log("[v0] Disparando Purchase via API server-side...")
          const purchaseRes = await fetch("/api/meta/purchase-from-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session_id: sessionId }),
          })
          const purchaseResult = await purchaseRes.json()
          console.log("[v0] Purchase API response:", purchaseResult)
        } catch (purchaseErr) {
          console.error("[v0] Erro ao disparar Purchase via API:", purchaseErr)
        }
        
        // 3) Meta Pixel Purchase client-side - Para deduplicação com o server
        // Usa o mesmo event_id que foi enviado no metadata do checkout
        const purchaseDataMeta = { value: sessionValue, currency: sessionCurrency, content_type: "product", order_id: sessionId }

        if (typeof window !== "undefined" && window.fbq) {
          // Dispara APENAS para o pixel UK2 1200200552118123
          window.fbq("trackSingle", "1200200552118123", "Purchase", purchaseDataMeta, { eventID: purchaseEventId })
        }

        // 4) TikTok Purchase with Advanced Matching
        // Identify user with email/phone from Stripe BEFORE tracking Purchase
        const customerDetails = sessionData?.customer_details
        if (customerDetails) {
          await identifyUser({
            email: customerDetails.email || undefined,
            phone_number: customerDetails.phone || undefined,
            external_id: sessionId || undefined,
          })
        }
        
        let tiktokData: any = null
        try {
          const stored = sessionStorage.getItem("tiktok_purchase_data")
          if (stored) {
            tiktokData = JSON.parse(stored)
            sessionStorage.removeItem("tiktok_purchase_data")
          }
        } catch {}
        
        // Track Purchase event (user already identified above)
        await trackPurchase({
          contents: tiktokData?.contents || [],
          value: tiktokData?.value || sessionValue,
          currency: "GBP",
          status: "completed",
          description: "Purchase completed",
        }).catch(() => {})

        // 5) Google Ads conversion
        if (typeof window !== "undefined" && window.gtag) {
          window.gtag("event", "conversion", {
            send_to: "AW-16953354830/_coaCO30w_8bEM7U_pM_",
            value: sessionValue,
            currency: "GBP",
            transaction_id: sessionId,
          })
        }
      } catch {}
    })()
  }, [sessionId, clearCart])

  return (
    <div className="min-h-screen bg-[#f9f7f4] py-10 px-4">
      <div className="mx-auto max-w-lg space-y-4">

        {/* Confirmation header */}
        <div className="rounded-xl bg-white border border-border shadow-sm p-6 text-center">
          <CheckCircle className="mx-auto h-14 w-14 text-green-500 mb-3" />
          <h1 className="text-2xl font-bold text-foreground">Thank you for your order!</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Your acoustic panel is being prepared for dispatch.
          </p>
          {purchaseData?.customerEmail && (
            <p className="text-xs text-muted-foreground mt-1">
              Confirmation sent to <strong>{purchaseData.customerEmail}</strong>
            </p>
          )}
          <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3">
            <Package className="h-4 w-4 text-green-600 flex-shrink-0" />
            <span className="text-sm text-green-700 font-medium">
              Estimated delivery: <strong>5 to 8 business days</strong>
            </span>
          </div>
          <div className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-blue-50 border border-blue-200 px-4 py-2">
            <span className="text-xs text-blue-700">
              Shipping to: <strong>United Kingdom</strong>
            </span>
          </div>
        </div>

        {/* Post-purchase upsell */}
        <div className="rounded-xl bg-white border border-[#FF6B00]/30 shadow-sm p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#FF6B00] mb-1">Exclusive offer for customers</p>
          <h2 className="text-base font-bold text-foreground mb-3">
            Complete your installation with the LED Kit
          </h2>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-secondary/30 flex-shrink-0">
              <Image
                src={LED_UPSELL.image}
                alt="Recessed LED Strip Kit"
                fill
                className="object-cover"
                crossOrigin="anonymous"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-snug">{LED_UPSELL.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{LED_UPSELL.description}</p>
              <p className="text-lg font-bold text-foreground mt-1">£{LED_UPSELL.price.toFixed(2)}</p>
            </div>
          </div>
          <Link
            href={`/product/${LED_UPSELL.slug}`}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#FF6B00] hover:bg-[#e05e00] text-white font-bold text-sm py-3 transition-colors"
          >
            <ShoppingCart className="h-4 w-4 flex-shrink-0" />
            Add to my order
          </Link>
          <p className="text-center text-xs text-muted-foreground mt-2">
            Free combined delivery with your order
          </p>
        </div>

        {/* Social proof + share */}
        <div className="rounded-xl bg-white border border-border shadow-sm p-5 text-center">
          <div className="flex justify-center gap-0.5 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-4 w-4 text-amber-400 fill-current" />
            ))}
          </div>
          <p className="text-sm font-medium">{"You're going to love your panel!"}</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            Join 4,500+ satisfied customers across the UK
          </p>
          <div className="flex flex-col gap-2">
            <Link
              href="/product/flexible-acoustic-panel-uk"
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-border py-2.5 text-sm font-medium hover:bg-secondary transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Order again
            </Link>
          </div>
        </div>

        {/* Order summary (if available) */}
        {purchaseData && (
          <div className="rounded-xl bg-white border border-border shadow-sm p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-3">Order Summary</h3>
            <div className="space-y-2">
              {purchaseData.lineItems?.map((item: any, i: number) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-muted-foreground line-clamp-1 flex-1 mr-2">{item.name} x{item.quantity}</span>
                  <span className="font-medium flex-shrink-0">£{item.amount.toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between font-semibold pt-2 border-t border-border">
                <span>Total paid</span>
                <span>£{((purchaseData.amount_total || 0) / 100).toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
