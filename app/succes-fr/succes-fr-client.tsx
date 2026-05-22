"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { CheckCircle, Package, RotateCcw, ShoppingCart, Star } from "lucide-react"
import { trackPurchase, identifyUser } from "@/lib/tiktok-events"
import { updateMetaUserData } from "@/lib/meta-pixel"
import { useCart } from "@/lib/cart-context"

declare global {
  interface Window {
    fbq?: (...args: any[]) => void
    gtag?: (...args: any[]) => void
  }
}

// LED upsell product (Kit Ruban LED Encastré from frequentlyBoughtTogether)
const LED_UPSELL = {
  id: "prod_RbJWvSQ5LGC",
  slug: "recessed-led-strip",
  name: "Kit Ruban LED Encastré",
  description: "Parfait avec votre panneau acoustique, éclairage intégré premium",
  price: 150.49,
  image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/kit-ruban-led-encastre-fr.jpg",
}

export default function SuccesFrClient({ sessionId }: { sessionId: string | null }) {
  const firedRef = useRef(false)
  const { clearCart } = useCart()
  const [purchaseData, setPurchaseData] = useState<any>(null)

  useEffect(() => {
    if (!sessionId || firedRef.current) return
    firedRef.current = true
    clearCart()

    // Correção 4 — Limpar dados do pré-checkout após sucesso
    try {
      sessionStorage.removeItem("checkout_order_fr")
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

        // 2) Meta Purchase - Disparado apenas via Stripe Webhook (server-side)
        // NÃO chamar /api/meta/purchase-from-session - o webhook já cuida disso
        // Isso evita duplicação de eventos no Meta
        
        // 3) Meta Pixel Purchase client-side (deduplicates with CAPI via event_id)
        const sessionValue = sessionData ? (sessionData.amount_total || 0) / 100 : 0
        const sessionCurrency = "EUR"
        // Usa o mesmo event_id que foi salvo no metadata do checkout
        const pixelEventId = sessionData?.metadata?.purchase_event_id || `purchase_${sessionId}`

        if (typeof window !== "undefined" && window.fbq) {
          // Fire to single Meta Pixel 1200200552118123
          window.fbq("track", "Purchase", { value: sessionValue, currency: sessionCurrency, content_type: "product", order_id: sessionId }, { eventID: pixelEventId })
        }

        // 4) TikTok Purchase with Advanced Matching
        // Identify user with email/phone from Stripe BEFORE tracking Purchase
        const customerDetailsTikTok = sessionData?.customer_details
        if (customerDetailsTikTok) {
          await identifyUser({
            email: customerDetailsTikTok.email || undefined,
            phone_number: customerDetailsTikTok.phone || undefined,
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
          currency: "EUR",
          status: "completed",
          description: "Purchase completed",
        }).catch(() => {})

        // 5) Google Ads conversion
        if (typeof window !== "undefined" && window.gtag) {
          window.gtag("event", "conversion", {
            send_to: "AW-16953354830/_coaCO30w_8bEM7U_pM_",
            value: sessionValue,
            currency: "EUR",
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
          <h1 className="text-2xl font-bold text-foreground">Merci pour votre commande !</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Votre panneau acoustique est en cours de préparation.
          </p>
          {purchaseData?.customerEmail && (
            <p className="text-xs text-muted-foreground mt-1">
              Confirmation envoyée à <strong>{purchaseData.customerEmail}</strong>
            </p>
          )}
          <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3">
            <Package className="h-4 w-4 text-green-600 flex-shrink-0" />
            <span className="text-sm text-green-700 font-medium">
              Livraison estimée : <strong>5 à 8 jours ouvrables</strong>
            </span>
          </div>
        </div>

        {/* Post-purchase upsell */}
        <div className="rounded-xl bg-white border border-[#FF6B00]/30 shadow-sm p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#FF6B00] mb-1">Offre exclusive pour clients qui ont acheté</p>
          <h2 className="text-base font-bold text-foreground mb-3">
            Complétez votre installation avec le Kit LED
          </h2>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-secondary/30 flex-shrink-0">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/led-strip-fr-upsell-a7bHzqJaYNB6n8mPqvUn5ZAaLAy4KQ.jpg"
                alt="Kit Ruban LED Encastré"
                fill
                className="object-cover"
                crossOrigin="anonymous"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-snug">{LED_UPSELL.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{LED_UPSELL.description}</p>
              <p className="text-lg font-bold text-foreground mt-1">€{LED_UPSELL.price.toFixed(2)}</p>
            </div>
          </div>
          <Link
            href={`/product/${LED_UPSELL.slug}`}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#FF6B00] hover:bg-[#e05e00] text-white font-bold text-sm py-3 transition-colors"
          >
            <ShoppingCart className="h-4 w-4 flex-shrink-0" />
            Ajouter à ma commande
          </Link>
          <p className="text-center text-xs text-muted-foreground mt-2">
            Livraison groupée gratuite avec votre commande
          </p>
        </div>

        {/* Social proof + share */}
        <div className="rounded-xl bg-white border border-border shadow-sm p-5 text-center">
          <div className="flex justify-center gap-0.5 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-4 w-4 text-amber-400 fill-current" />
            ))}
          </div>
          <p className="text-sm font-medium">Vous allez adorer votre panneau !</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            Rejoignez 4 500+ clients satisfaits en France
          </p>
          <div className="flex flex-col gap-2">
            <Link
              href="/product/flexible-acoustic-panel-fr"
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-border py-2.5 text-sm font-medium hover:bg-secondary transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Commander à nouveau
            </Link>
          </div>
        </div>

        {/* Order summary (if available) */}
        {purchaseData && (
          <div className="rounded-xl bg-white border border-border shadow-sm p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-3">Récapitulatif</h3>
            <div className="space-y-2">
              {purchaseData.lineItems?.map((item: any, i: number) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-muted-foreground line-clamp-1 flex-1 mr-2">{item.name} x{item.quantity}</span>
                  <span className="font-medium flex-shrink-0">€{item.amount.toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between font-semibold pt-2 border-t border-border">
                <span>Total payé</span>
                <span>€{((purchaseData.amount_total || 0) / 100).toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
