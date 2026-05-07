"use client"

import { useCallback, useState } from "react"
import { loadStripe } from "@stripe/stripe-js"
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js"
import { createCheckoutSession } from "@/app/actions/stripe"
import { trackAddPaymentInfo, trackInitiateCheckout, formatCartForTikTok, storePurchaseData } from "@/lib/tiktok-events"
import { Button } from "@/components/ui/button"
import { Loader2, AlertCircle, RefreshCw } from "lucide-react"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface CartItem {
  product: {
    id: string
    name: string
    price: number
    salePrice?: number
  }
  quantity: number
}

interface StripeCheckoutProps {
  items: CartItem[]
  onInitiateCheckout?: () => void
}

export function StripeCheckout({ items, onInitiateCheckout }: StripeCheckoutProps) {
  const [showCheckout, setShowCheckout] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchClientSecret = useCallback(async () => {
    try {
      setError(null)
      // Generate unique event ID for deduplication
      const eventId = `purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // Calculate total
      const totalValue = items.reduce((sum, item) => {
        const price = item.product.salePrice || item.product.price
        return sum + price * item.quantity
      }, 0)

      // Format items for TikTok
      const tiktokItems = formatCartForTikTok(items)

      // Detect currency from items
      const currency = items[0]?.product?.currency || 'GBP'

      // Store purchase data for later (when user completes purchase)
      storePurchaseData({
        contents: tiktokItems,
        value: totalValue,
        currency,
        event_id: eventId,
      })

      // Read Meta cookies _fbc and _fbp from browser
      const getCookie = (name: string) => {
        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
        return match ? decodeURIComponent(match[2]) : undefined
      }
      const fbc = getCookie('_fbc')
      const fbp = getCookie('_fbp')

      console.log("[v0] Creating checkout session for items:", items.length)

      const { clientSecret } = await createCheckoutSession(
        items, 
        window.location.origin,
        {
          eventId,
          eventSourceUrl: window.location.href,
          fbc,
          fbp,
        }
      )
      
      if (!clientSecret) {
        throw new Error("No client secret returned from server")
      }
      
      console.log("[v0] Checkout session created successfully")
      return clientSecret
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred"
      console.error("[v0] Error creating checkout session:", errorMessage)
      setError(errorMessage)
      throw err
    }
  }, [items])

  const handleStartCheckout = async () => {
    if (items.length === 0) return
    setLoading(true)
    setError(null)
    
    // Calculate total and items for TikTok
    const totalValue = items.reduce((sum, item) => {
      const price = item.product.salePrice || item.product.price
      return sum + price * item.quantity
    }, 0)
    const tiktokItems = formatCartForTikTok(items)
    const numItems = items.reduce((sum, item) => sum + item.quantity, 0)
    const currency = items[0]?.product?.currency || 'GBP'

    // Track TikTok InitiateCheckout event BEFORE showing checkout
    try {
      await trackInitiateCheckout({
        contents: tiktokItems,
        value: totalValue,
        currency,
        description: `Checkout initiated with ${numItems} items`,
      })
      if (process.env.NODE_ENV !== "production") {
        console.log("[v0] TikTok InitiateCheckout tracked:", { value: totalValue, currency, numItems })
      }
    } catch (error) {
      console.error('[v0] Error tracking InitiateCheckout:', error)
    }

    // Track AddPaymentInfo when payment form is shown
    try {
      await trackAddPaymentInfo({
        contents: tiktokItems,
        value: totalValue,
        currency,
      })
    } catch (error) {
      console.error('[v0] Error tracking AddPaymentInfo:', error)
    }

    onInitiateCheckout?.()
    setShowCheckout(true)
    setLoading(false)
  }

  const handleRetry = () => {
    setError(null)
    setShowCheckout(false)
    setTimeout(() => {
      handleStartCheckout()
    }, 100)
  }

  if (error) {
    return (
      <div className="w-full space-y-4">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-800">Something went wrong</p>
              <p className="text-xs text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
        <Button
          onClick={handleRetry}
          className="w-full"
          size="lg"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    )
  }

  if (showCheckout) {
    return (
      <div className="w-full space-y-3">
        <p className="text-xs text-muted-foreground text-center">
          Supported payment methods: Card, Apple Pay, Google Pay
        </p>
        <EmbeddedCheckoutProvider 
          stripe={stripePromise} 
          options={{ 
            fetchClientSecret,
            onComplete: () => {
              console.log("[v0] Checkout completed")
            }
          }}
        >
          <EmbeddedCheckout 
            onLoadError={(err) => {
              console.error("[v0] EmbeddedCheckout load error:", err)
              setError(err.error?.message || "Error loading payment form")
            }}
          />
        </EmbeddedCheckoutProvider>
      </div>
    )
  }

  return (
    <Button
      onClick={handleStartCheckout}
      disabled={loading || items.length === 0}
      className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
      size="lg"
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading...
        </>
      ) : (
        "Proceed to Checkout"
      )}
    </Button>
  )
}

export default StripeCheckout
