"use client"

import { useCallback, useState } from "react"
import { loadStripe } from "@stripe/stripe-js"
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js"
import { createCheckoutSessionUK } from "@/app/actions/stripe"
import { formatCartForTikTok, storePurchaseData, trackInitiateCheckout } from "@/lib/tiktok-events"
import { Loader2, Lock, Gift, Check, Wrench, AlertCircle, RefreshCw } from "lucide-react"
import Image from "next/image"

const CLEANER_IMAGE = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/CLEAN04-jsHtrQ87vwg45Qyo5RrSkzrJbV2MXC.jpg"
const PANEL_IMAGE = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/panneu01-COvuniuy0UAMH2wAwPKmS9Tlev4Qrt.avif"

interface BonusData {
  bonusPanels: number
  cleanerIncluded: boolean
  technicianIncluded: boolean
  installationCode: string
  bonusValue: number
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface CartItem {
  product: {
    id: string
    name: string
    price: number
    salePrice?: number
    currency?: string
  }
  quantity: number
}

interface StripeCheckoutUKProps {
  items: CartItem[]
  onInitiateCheckout?: () => void
  bonusData?: BonusData | null
}

export function StripeCheckoutUK({ items, onInitiateCheckout, bonusData }: StripeCheckoutUKProps) {
  const [showCheckout, setShowCheckout] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchClientSecret = useCallback(async () => {
    try {
      setError(null)
      const eventId = `purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      const totalValue = items.reduce((sum, item) => {
        const price = item.product.salePrice || item.product.price
        return sum + price * item.quantity
      }, 0)

      const tiktokItems = formatCartForTikTok(items)

      storePurchaseData({
        contents: tiktokItems,
        value: totalValue,
        currency: "GBP",
        event_id: eventId,
      })

      const getCookie = (name: string) => {
        const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"))
        return match ? decodeURIComponent(match[2]) : undefined
      }
      const fbc = getCookie("_fbc")
      const fbp = getCookie("_fbp")

      console.log("[v0] Creating UK checkout session for items:", items.length)
      
      const result = await createCheckoutSessionUK(items, window.location.origin, {
        eventId,
        eventSourceUrl: window.location.href,
        fbc,
        fbp,
      })
      
      if (!result.clientSecret) {
        throw new Error("No client secret returned from server")
      }
      
      console.log("[v0] UK Checkout session created successfully")
      return result.clientSecret
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred"
      console.error("[v0] Error creating UK checkout session:", errorMessage)
      setError(errorMessage)
      throw err
    }
  }, [items])

  const handleStartCheckout = async () => {
    if (items.length === 0) return
    setLoading(true)
    setError(null)

    // Track TikTok InitiateCheckout event BEFORE showing checkout
    const totalValue = items.reduce((sum, item) => {
      const price = item.product.salePrice || item.product.price
      return sum + price * item.quantity
    }, 0)
    const tiktokItems = formatCartForTikTok(items)
    const numItems = items.reduce((sum, item) => sum + item.quantity, 0)

    try {
      await trackInitiateCheckout({
        contents: tiktokItems,
        value: totalValue,
        currency: "GBP",
        description: `Checkout initiated with ${numItems} items`,
      })
      if (process.env.NODE_ENV !== "production") {
        console.log("[v0] TikTok InitiateCheckout tracked:", { value: totalValue, currency: "GBP", numItems })
      }
    } catch (err) {
      console.error("[v0] Error tracking InitiateCheckout:", err)
    }

    onInitiateCheckout?.()
    setShowCheckout(true)
    setLoading(false)
  }

  const handleRetry = () => {
    setError(null)
    setShowCheckout(false)
    // Small delay before restarting
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
              <p className="text-sm font-semibold text-red-800">An error occurred</p>
              <p className="text-xs text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
        <button
          onClick={handleRetry}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#FF6B00] hover:bg-[#e05e00] text-white font-bold text-base py-3 px-6 transition-colors duration-200"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
      </div>
    )
  }

  if (showCheckout) {
    return (
      <div className="w-full space-y-3">
        <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
          <Lock className="h-3 w-3" />
          100% SSL Secure Payment - Visa, Mastercard, American Express
        </p>

        {/* Bonus items reminder before payment */}
        {bonusData && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 mb-2">
            <div className="flex items-center gap-2 mb-2">
              <Gift className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-semibold text-amber-800">Your Free Bonuses</span>
              <span className="ml-auto text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">FREE</span>
            </div>
            <div className="space-y-1.5">
              {/* Bonus panels */}
              <div className="flex items-center gap-2">
                <div className="relative w-8 h-8 rounded overflow-hidden bg-white flex-shrink-0 border border-amber-200">
                  <Image src={PANEL_IMAGE} alt="Bonus Panels" fill className="object-cover" unoptimized />
                </div>
                <span className="text-xs text-amber-900 flex-1">{bonusData.bonusPanels} Bonus Panels</span>
                <Check className="w-3.5 h-3.5 text-green-600" />
              </div>
              {/* Cleaner */}
              {bonusData.cleanerIncluded && (
                <div className="flex items-center gap-2">
                  <div className="relative w-8 h-8 rounded overflow-hidden bg-white flex-shrink-0 border border-amber-200">
                    <Image src={CLEANER_IMAGE} alt="Panel Cleaner" fill className="object-cover" unoptimized />
                  </div>
                  <span className="text-xs text-amber-900 flex-1">Panel Cleaner</span>
                  <Check className="w-3.5 h-3.5 text-green-600" />
                </div>
              )}
              {/* Technician */}
              {bonusData.technicianIncluded && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-amber-100 flex items-center justify-center flex-shrink-0 border border-amber-200">
                    <Wrench className="w-4 h-4 text-amber-700" />
                  </div>
                  <span className="text-xs text-amber-900 flex-1">Installation Technician</span>
                  <Check className="w-3.5 h-3.5 text-green-600" />
                </div>
              )}
            </div>
            {/* Installation code reminder */}
            <div className="mt-2 pt-2 border-t border-amber-200 flex items-center justify-between">
              <span className="text-[10px] text-amber-700">Installation code:</span>
              <span className="text-xs font-bold text-amber-900 bg-white border border-amber-200 rounded px-2 py-0.5 tracking-wider">
                {bonusData.installationCode}
              </span>
            </div>
          </div>
        )}

        <EmbeddedCheckoutProvider 
          stripe={stripePromise} 
          options={{ 
            fetchClientSecret,
            onComplete: () => {
              console.log("[v0] UK Checkout completed")
            }
          }}
        >
          <EmbeddedCheckout 
            onLoadError={(err) => {
              console.error("[v0] UK EmbeddedCheckout load error:", err)
              setError(err.error?.message || "Error loading payment")
            }}
          />
        </EmbeddedCheckoutProvider>
      </div>
    )
  }

  return (
    <button
      onClick={handleStartCheckout}
      disabled={loading || items.length === 0}
      className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#FF6B00] hover:bg-[#e05e00] text-white font-bold text-lg py-4 px-8 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading...
        </>
      ) : (
        <>
          <Lock className="h-5 w-5 flex-shrink-0" />
          Confirm My Order
        </>
      )}
    </button>
  )
}
