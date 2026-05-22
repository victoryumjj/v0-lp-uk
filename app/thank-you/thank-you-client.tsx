"use client"

import { useEffect, useRef, useState } from "react"
import Script from "next/script"
import Link from "next/link"
import { CheckCircle, Home, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { trackPurchase, identifyUser } from "@/lib/tiktok-events"
import { updateMetaUserData } from "@/lib/meta-pixel"

declare global {
  interface Window {
    fbq?: (...args: any[]) => void
    gtag?: (...args: any[]) => void
    ttq?: {
      track: (eventName: string, data?: Record<string, any>) => void
      page: () => void
    }
  }
}

export default function ThankYouClient({ sessionId }: { sessionId: string | null }) {
  const firedRef = useRef(false)
  const [isLoading, setIsLoading] = useState(true)
  const [purchaseData, setPurchaseData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId) {
      setError("No session ID found")
      setIsLoading(false)
      return
    }
    if (firedRef.current) return
    firedRef.current = true

    ;(async () => {
      try {
        // 1) Fetch session details (optional UI)
        let sessionData: any = null
        const sessionRes = await fetch(`/api/stripe/session?session_id=${sessionId}`)
        if (sessionRes.ok) {
          sessionData = await sessionRes.json()
          setPurchaseData(sessionData)
          
          // Update Meta Pixel with user data for Advanced Matching (immediate + future page loads)
          const customerDetails = sessionData?.customer_details
          if (customerDetails) {
            let firstName: string | undefined
            let lastName: string | undefined
            if (customerDetails.name) {
              const nameParts = customerDetails.name.trim().split(' ')
              if (nameParts.length >= 1) firstName = nameParts[0]
              if (nameParts.length >= 2) lastName = nameParts[nameParts.length - 1]
            }
            
            // This updates the pixel immediately AND saves to localStorage for future visits
            updateMetaUserData({
              email: customerDetails.email || undefined,
              phone: customerDetails.phone || undefined,
              firstName,
              lastName,
              externalId: sessionId || undefined,
            })
          }
        }

        // 2) Meta Purchase - Disparado apenas via Stripe Webhook (server-side)
        // NÃO chamar /api/meta/purchase-from-session - o webhook já cuida disso
        // Isso evita duplicação de eventos no Meta
        
        // 3) Fire Meta Pixel Purchase client-side (deduplicates with CAPI via event_id)
        const sessionValue = sessionData ? (sessionData.amount_total || 0) / 100 : 0
        const sessionCurrency = (sessionData?.currency || "EUR").toUpperCase()
        // Usa o mesmo event_id que foi salvo no metadata do checkout
        const pixelEventId = sessionData?.metadata?.purchase_event_id || `purchase_${sessionId}`
        const purchaseData = {
          value: sessionValue,
          currency: sessionCurrency,
          content_type: "product",
          order_id: sessionId,
        }

        if (typeof window !== "undefined" && window.fbq) {
          // Fire to single Meta Pixel 1200200552118123
          window.fbq("track", "Purchase", purchaseData, { eventID: pixelEventId })
        }

        // 4) Track TikTok Purchase with Advanced Matching
        // Identify user with email/phone from Stripe BEFORE tracking Purchase
        const customerDetails = sessionData?.customer_details
        if (customerDetails) {
          await identifyUser({
            email: customerDetails.email || undefined,
            phone_number: customerDetails.phone || undefined,
            external_id: sessionId || undefined,
          })
        }
        
        // Direct call via ttq (user already identified above)
        if (typeof window !== 'undefined' && window.ttq) {
          window.ttq.track('CompletePayment', {
            value: sessionValue,
            currency: sessionCurrency,
            contents: [{
              content_id: sessionId,
              content_type: 'product',
              content_name: 'Purchase',
              price: sessionValue,
              quantity: 1
            }]
          })
        }

        // Also use trackPurchase helper as backup
        let tiktokData: any = null
        try {
          const stored = sessionStorage.getItem('tiktok_purchase_data')
          if (stored) {
            tiktokData = JSON.parse(stored)
            sessionStorage.removeItem('tiktok_purchase_data')
          }
        } catch (e) {
          console.warn('[v0] Could not read TikTok stored data:', e)
        }

        const tiktokPayload = {
          contents: tiktokData?.contents || [],
          value: tiktokData?.value || sessionValue,
          currency: tiktokData?.currency || sessionCurrency,
          status: 'completed',
          description: 'Purchase completed',
        }

        try {
          await trackPurchase(tiktokPayload)
        } catch (tiktokErr) {
          console.error('[v0] TikTok Purchase - Error:', tiktokErr)
        }

        // 5) Fire Google Ads Conversion Tracking
        if (typeof window !== "undefined" && window.gtag) {
          window.gtag('event', 'conversion', {
            'send_to': 'AW-17015613738/V-16CKmc_P4bEKrS1rE_',
            'value': sessionValue,
            'currency': sessionCurrency,
            'transaction_id': sessionId
          })

          // Google Ads - Compra conversion (AW-16953354830)
          window.gtag('event', 'conversion', {
            'send_to': 'AW-16953354830/_coaCO30w_8bEM7U_pM_',
            'value': 14.0,
            'currency': 'EUR',
            'transaction_id': sessionId
          })

          // Google Ads - Conversão AW-829407887
          window.gtag('event', 'conversion', {
            'send_to': 'AW-829407887/C0XCCO30w_8bEM7U_pM_',
            'value': sessionValue,
            'currency': sessionCurrency,
            'transaction_id': sessionId
          })

          // Google Ads - Compra conversion (AW-11316024864)
          window.gtag('event', 'conversion', {
            'send_to': 'AW-11316024864/FMZtCJ3t4IEcEKCs85Mq',
            'value': 14.0,
            'currency': 'EUR',
            'transaction_id': sessionId
          })
        }

        setIsLoading(false)
      } catch (e) {
        console.error("[v0] Thank You - Error:", e)
        setError(e instanceof Error ? e.message : "An error occurred")
        setIsLoading(false)
      }
    })()
  }, [sessionId])

  if (!sessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="text-6xl text-destructive">⚠️</div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">No Order Found</h1>
            <p className="text-muted-foreground">
              We couldn't find your order. Please check your email for confirmation.
            </p>
          </div>
          <Link href="/">
            <Button className="w-full">
              <Home className="mr-2 h-4 w-4" />
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Google Ads Conversion Tag - AW-829407887 */}
      <Script async src="https://www.googletagmanager.com/gtag/js?id=AW-829407887" strategy="afterInteractive" />
      <Script id="google-ads-conversion-829407887" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'AW-829407887');
        `}
      </Script>

      <main className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full space-y-8">
        {/* Success Icon */}
        <div className="flex justify-center">
          <CheckCircle className="h-20 w-20 text-green-600" />
        </div>

        {/* Message */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold text-foreground">
            {purchaseData?.metadata?.content_ids?.includes('-fr') ? 'Félicitations !' : 'Thank You!'}
          </h1>
          <p className="text-muted-foreground text-lg">
            {purchaseData?.metadata?.content_ids?.includes('-fr')
              ? 'Félicitations pour votre achat, vous recevrez votre commande dans 5 à 8 jours ouvrables ! Expédition sous 24-48h après commande. En cas de questions, envoyez un email à homepanel@panel.com'
              : 'Your order has been confirmed. You will receive an email confirmation shortly.'}
          </p>
        </div>

        {/* Order Details */}
        {purchaseData && !isLoading && (
          <div className="bg-muted/50 rounded-lg p-6 space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Order ID</p>
              <p className="font-mono text-sm font-semibold break-all">{sessionId}</p>
            </div>

            {purchaseData.amount_total && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold">
                  {(purchaseData.amount_total / 100).toLocaleString("en-GB", {
                    style: "currency",
                    currency: purchaseData.currency?.toUpperCase() || "GBP",
                  })}
                </p>
              </div>
            )}

            {purchaseData.customer_details?.email && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="text-sm">{purchaseData.customer_details.email}</p>
              </div>
            )}
          </div>
        )}

        {/* Status */}
        {isLoading && (
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">Processing your order...</p>
            <div className="flex justify-center">
              <div className="animate-spin h-4 w-4 border-2 border-foreground border-t-transparent rounded-full" />
            </div>
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <Link href="/">
            <Button variant="outline" className="w-full bg-transparent">
              <Home className="mr-2 h-4 w-4" />
              Return Home
            </Button>
          </Link>

          <Link href="/products">
            <Button className="w-full">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Continue Shopping
            </Button>
          </Link>
        </div>

        {/* Debug Info */}
        <div className="text-xs text-muted-foreground text-center space-y-1 pt-4 border-t">
          <p>Session ID: {sessionId}</p>
          <p>Status: {isLoading ? "Loading..." : "Complete"}</p>
        </div>
      </div>
    </main>
    </>
  )
}
