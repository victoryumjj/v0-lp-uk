"use client"

import { useState } from "react"
import { AlertCircle, Loader2, Lock } from "lucide-react"
import { formatCartForTikTok, storePurchaseData, trackInitiateCheckout } from "@/lib/tiktok-events"
import type { PayPalCheckoutItem } from "@/components/paypal-checkout"

/**
 * Pagou hosted checkout: the button creates a checkout link on the server
 * (prices validated server-side) and sends the buyer to Pagou's payment page.
 * Payment confirmation and the Meta Purchase come from the Pagou webhook.
 */
interface PagouCheckoutProps {
  market: "UK" | "FR"
  items: PayPalCheckoutItem[]
  onInitiateCheckout?: () => void
  copy: { confirmButton: string; loading: string; securePayment: string; errorTitle: string; genericError: string }
}

const CURRENCY = { UK: "GBP", FR: "EUR" } as const
const unitPriceOf = (i: PayPalCheckoutItem) => i.product.salePrice ?? i.product.price

export function PagouCheckout({ market, items, onInitiateCheckout, copy }: PagouCheckoutProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClick = async () => {
    if (items.length === 0 || loading) return
    setLoading(true)
    setError(null)

    const currency = CURRENCY[market]
    const value = items.reduce((s, i) => s + unitPriceOf(i) * i.quantity, 0)
    const numItems = items.reduce((s, i) => s + i.quantity, 0)
    try {
      await trackInitiateCheckout({
        contents: formatCartForTikTok(items),
        value,
        currency,
        description: `Checkout initiated with ${numItems} items`,
      })
      storePurchaseData({ contents: formatCartForTikTok(items), value, currency })
    } catch {}
    onInitiateCheckout?.()

    try {
      const res = await fetch("/api/pagou/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          market,
          items: items.map((i) => ({ id: i.product.id, quantity: i.quantity, unitPrice: unitPriceOf(i) })),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.url) throw new Error(data?.code ? `${data.error} (${data.code})` : data?.error)
      window.location.assign(data.url)
    } catch (err) {
      setError((err instanceof Error && err.message) || copy.genericError)
      setLoading(false)
    }
  }

  return (
    <div className="w-full space-y-3">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-800">{copy.errorTitle}</p>
              <p className="text-xs text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}
      <button
        onClick={handleClick}
        disabled={loading || items.length === 0}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#FF6B00] hover:bg-[#e05e00] text-white font-bold text-lg py-4 px-8 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            {copy.loading}
          </>
        ) : (
          <>
            <Lock className="h-5 w-5 flex-shrink-0" />
            {copy.confirmButton}
          </>
        )}
      </button>
      <p className="text-[11px] leading-snug text-muted-foreground text-center flex items-center justify-center gap-1.5 px-2">
        <Lock className="h-3 w-3 flex-shrink-0" />
        <span>{copy.securePayment}</span>
      </p>
    </div>
  )
}
