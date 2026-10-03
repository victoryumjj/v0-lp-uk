"use client"

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { AlertCircle, Loader2, Lock, RefreshCw } from "lucide-react"
import { formatCartForTikTok, storePurchaseData, trackInitiateCheckout } from "@/lib/tiktok-events"
import { setupWallets, type CaptureResult, type WalletShipping } from "@/components/paypal-wallets"

/**
 * PayPal checkout (JavaScript SDK v6).
 * - The browser never decides the price or whether a sale is paid.
 * - /api/paypal/create-order builds the amount server-side.
 * - /api/paypal/capture-order captures and confirms on the server.
 */

export type PayPalMarket = "UK" | "FR"

export interface PayPalCheckoutItem {
  product: {
    id: string
    name: string
    price: number
    salePrice?: number
    currency?: string
  }
  quantity: number
}

export interface PayPalCheckoutCopy {
  confirmButton: string
  loading: string
  securePayment: string
  errorTitle: string
  tryAgain: string
  genericError: string
  cancelled: string
  declined: string
  shippingNotSupported: string
  shippingMissing: string
  processing: string
  cardButtonLabel: string
  cartUpdated: string
}

interface PayPalCheckoutProps {
  market: PayPalMarket
  items: PayPalCheckoutItem[]
  onInitiateCheckout?: () => void
  copy: PayPalCheckoutCopy
  /** Rendered above the payment buttons (e.g. bonus reminder) */
  children?: ReactNode
}

const CURRENCY: Record<PayPalMarket, string> = { UK: "GBP", FR: "EUR" }

// PayPal web components render inline by default (they don't stretch): force full width
const PAYPAL_BUTTON_STYLE = { display: "block", width: "100%", maxWidth: "100%" } as const
const LOCALE: Record<PayPalMarket, string> = { UK: "en-GB", FR: "fr-FR" }

// Delivery countries accepted inside the PayPal window (the server re-checks before capture)
const SHIPPING_COUNTRIES: Record<PayPalMarket, string[]> = {
  UK: ["GB"],
  FR: ["FR", "BE", "CH", "LU", "MC", "DE", "NL", "ES", "IT", "PT", "AT", "IE"],
}

// ─── SDK loader (one script per page) ───────────────────────────────────────
let sdkPromise: Promise<any> | null = null

function loadPayPalSdk(env: "sandbox" | "live"): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("No window"))
  if ((window as any).paypal?.createInstance) return Promise.resolve((window as any).paypal)
  if (sdkPromise) return sdkPromise

  const src =
    env === "live" ? "https://www.paypal.com/web-sdk/v6/core" : "https://www.sandbox.paypal.com/web-sdk/v6/core"

  sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script")
    script.src = src
    script.async = true
    script.onload = () => resolve((window as any).paypal)
    script.onerror = () => {
      sdkPromise = null
      reject(new Error("PayPal SDK failed to load"))
    }
    document.head.appendChild(script)
  })
  return sdkPromise
}

function unitPriceOf(item: PayPalCheckoutItem) {
  return item.product.salePrice ?? item.product.price
}

export function PayPalCheckout({ market, items, onInitiateCheckout, copy, children }: PayPalCheckoutProps) {
  const [showCheckout, setShowCheckout] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sdkReady, setSdkReady] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [cardAvailable, setCardAvailable] = useState(false)
  const [paypalAvailable, setPaypalAvailable] = useState(false)
  const [applePayAvailable, setApplePayAvailable] = useState(false)
  const [googlePayAvailable, setGooglePayAvailable] = useState(false)
  const [attempt, setAttempt] = useState(0)

  const currency = CURRENCY[market]

  // Always use the latest items (quantity can still change on the checkout page)
  const itemsRef = useRef(items)
  itemsRef.current = items

  // Cart signature: if the cart changes after a PayPal order was created, that order
  // (and an open card form) holds the OLD total → discard it and start fresh.
  const cartKey = JSON.stringify(items.map((i) => [i.product.id, i.quantity, unitPriceOf(i)]))
  const orderCartKeyRef = useRef<string | null>(null)

  const paypalButtonRef = useRef<HTMLElement | null>(null)
  const cardButtonRef = useRef<HTMLElement | null>(null)
  const applePayRef = useRef<HTMLDivElement | null>(null)
  const googlePayRef = useRef<HTMLDivElement | null>(null)

  const getTotal = useCallback(() => {
    const cents = itemsRef.current.reduce((sum, i) => sum + Math.round(unitPriceOf(i) * 100) * i.quantity, 0)
    return (cents / 100).toFixed(2)
  }, [])

  // ── Server calls ──────────────────────────────────────────────────────────
  const createOrder = useCallback(async (shipping?: WalletShipping): Promise<{ orderId: string }> => {
    const current = itemsRef.current
    setError(null)
    setNotice(null)
    orderCartKeyRef.current = JSON.stringify(current.map((i) => [i.product.id, i.quantity, unitPriceOf(i)]))

    // Keep the existing TikTok Purchase helper data (read on the success page)
    const totalValue = current.reduce((sum, i) => sum + unitPriceOf(i) * i.quantity, 0)
    try {
      storePurchaseData({ contents: formatCartForTikTok(current), value: totalValue, currency })
    } catch {}

    const res = await fetch("/api/paypal/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        market,
        items: current.map((i) => ({ id: i.product.id, quantity: i.quantity, unitPrice: unitPriceOf(i) })),
        ...(shipping ? { shipping } : {}),
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data.orderId) {
      const message =
        data?.error === "SHIPPING_COUNTRY_NOT_SUPPORTED"
          ? copy.shippingNotSupported
          : data?.error === "SHIPPING_ADDRESS_INVALID"
            ? copy.shippingMissing
            : data?.error || copy.genericError
      setError(message)
      throw new Error(message)
    }
    return { orderId: data.orderId }
  }, [market, currency, copy.genericError, copy.shippingNotSupported, copy.shippingMissing])

  // Server confirms + captures; returns where to go next (success page) or an error message
  const captureOnServer = useCallback(
    async (orderId: string): Promise<CaptureResult> => {
      try {
        const res = await fetch("/api/paypal/capture-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, pageUrl: window.location.href }),
        })
        const result = await res.json().catch(() => ({}))
        if (result.redirectUrl) return { redirectUrl: result.redirectUrl, message: null }
        const message =
          result.errorCode === "INSTRUMENT_DECLINED"
            ? copy.declined
            : result.errorCode === "SHIPPING_COUNTRY_NOT_SUPPORTED"
              ? copy.shippingNotSupported
              : result.errorCode === "SHIPPING_ADDRESS_MISSING"
                ? copy.shippingMissing
                : copy.genericError
        return { redirectUrl: null, message }
      } catch {
        return { redirectUrl: null, message: copy.genericError }
      }
    },
    [copy],
  )

  const onApprove = useCallback(
    async (data: { orderId: string }) => {
      setProcessing(true)
      setError(null)
      const result = await captureOnServer(data.orderId)
      if (result.redirectUrl) {
        window.location.assign(result.redirectUrl)
        return
      }
      setError(result.message)
      setProcessing(false)
    },
    [captureOnServer],
  )

  // Quantity / upsell changed after the payment form was opened → rebuild the buttons
  // so the next payment uses the new total (the old PayPal order is never captured).
  useEffect(() => {
    if (!orderCartKeyRef.current || orderCartKeyRef.current === cartKey || processing) return
    orderCartKeyRef.current = null
    setPaypalAvailable(false)
    setCardAvailable(false)
    setApplePayAvailable(false)
    setGooglePayAvailable(false)
    setError(null)
    setNotice(copy.cartUpdated)
    setAttempt((a) => a + 1)
  }, [cartKey, processing, copy.cartUpdated])

  // ── SDK init (when the payment step is shown) ─────────────────────────────
  useEffect(() => {
    if (!showCheckout) return
    let cancelled = false
    const cleanups: Array<() => void> = []

    ;(async () => {
      try {
        setSdkReady(false)
        const cfgRes = await fetch("/api/paypal/config")
        if (!cfgRes.ok) throw new Error("config")
        const { clientId, clientToken, env } = await cfgRes.json()

        const paypal = await loadPayPalSdk(env)
        const sdk = await paypal.createInstance({
          ...(clientToken ? { clientToken } : { clientId }),
          components: ["paypal-payments", "paypal-guest-payments"],
          pageType: "checkout",
          locale: LOCALE[market],
        })
        if (cancelled) return

        const sessionOptions = {
          onApprove,
          onCancel: () => setNotice(copy.cancelled),
          onError: (err: unknown) => {
            console.error("[PayPal] SDK error:", err)
            setError(copy.genericError)
          },
          onWarn: (warn: unknown) => console.warn("[PayPal] SDK warning:", warn),
          // Blocks delivery addresses outside the allowed countries directly in the PayPal form
          onShippingAddressChange: async (data: {
            errors?: Record<string, string>
            shippingAddress?: { countryCode?: string }
          }) => {
            const country = data?.shippingAddress?.countryCode
            if (!country || !SHIPPING_COUNTRIES[market].includes(country)) {
              throw new Error(data?.errors?.COUNTRY_ERROR || copy.shippingNotSupported)
            }
          },
        }

        // Eligibility lookup can fail on live accounts (ERR_INIT_FIND_ELIGIBLE_METHODS)
        // even though orders work, so treat a failed lookup as "PayPal is available".
        let paypalEligible = true
        try {
          const eligible = await sdk.findEligibleMethods({ currencyCode: currency })
          paypalEligible = eligible.isEligible("paypal")
        } catch (err) {
          console.warn("[PayPal] Eligibility check failed, showing PayPal anyway:", err)
        }
        if (cancelled) return

        // PayPal wallet button
        if (paypalEligible) {
          const session = sdk.createPayPalOneTimePaymentSession(sessionOptions)
          setPaypalAvailable(true)
          const onClick = async () => {
            try {
              // Do not await createOrder() before start(): keeps the browser's user activation
              await session.start({ presentationMode: "auto" }, createOrder())
            } catch (err) {
              console.error("[PayPal] start error:", err)
            }
          }
          const el = paypalButtonRef.current
          el?.addEventListener("click", onClick)
          cleanups.push(() => el?.removeEventListener("click", onClick))
        }

        // Debit / credit card without a PayPal account
        try {
          const guestSession = await sdk.createPayPalGuestOneTimePaymentSession(sessionOptions)
          if (cancelled) return
          setCardAvailable(true)
          const onCardClick = async () => {
            try {
              await guestSession.start({ presentationMode: "auto" }, createOrder())
            } catch (err) {
              console.error("[PayPal] card start error:", err)
            }
          }
          const cardEl = cardButtonRef.current
          cardEl?.addEventListener("click", onCardClick)
          cleanups.push(() => cardEl?.removeEventListener("click", onCardClick))
        } catch (err) {
          console.warn("[PayPal] Card (guest) payments not available:", err)
        }

        setSdkReady(true)

        // Apple Pay / Google Pay: only shown when PayPal + the device support them
        setupWallets({
          paypal,
          clientId,
          clientToken,
          env,
          locale: LOCALE[market],
          currency,
          allowedCountries: SHIPPING_COUNTRIES[market],
          messages: {
            shippingNotSupported: copy.shippingNotSupported,
            genericError: copy.genericError,
            declined: copy.declined,
            cancelled: copy.cancelled,
          },
          getTotal,
          createOrder: (shipping) => createOrder(shipping),
          captureOnServer,
          appleContainer: applePayRef.current,
          googleContainer: googlePayRef.current,
          onAppleAvailable: () => !cancelled && setApplePayAvailable(true),
          onGoogleAvailable: () => !cancelled && setGooglePayAvailable(true),
          setProcessing,
          setError,
          setNotice,
          isCancelled: () => cancelled,
        }).catch((err) => console.warn("[PayPal] Wallets not available:", err))
      } catch (err) {
        console.error("[PayPal] init failed:", err)
        if (!cancelled) setError(copy.genericError)
      }
    })()

    return () => {
      cancelled = true
      cleanups.forEach((fn) => fn())
    }
  }, [showCheckout, attempt, market, currency, createOrder, onApprove, captureOnServer, getTotal, copy])

  // ── Start button (same as before) ─────────────────────────────────────────
  const handleStartCheckout = async () => {
    const current = itemsRef.current
    if (current.length === 0) return
    setLoading(true)
    setError(null)

    const totalValue = current.reduce((sum, i) => sum + unitPriceOf(i) * i.quantity, 0)
    const numItems = current.reduce((sum, i) => sum + i.quantity, 0)
    try {
      await trackInitiateCheckout({
        contents: formatCartForTikTok(current),
        value: totalValue,
        currency,
        description: `Checkout initiated with ${numItems} items`,
      })
    } catch (err) {
      console.error("[v0] Error tracking InitiateCheckout:", err)
    }

    onInitiateCheckout?.()
    setShowCheckout(true)
    setLoading(false)
  }

  const handleRetry = () => {
    setError(null)
    setNotice(null)
    setPaypalAvailable(false)
    setCardAvailable(false)
    setApplePayAvailable(false)
    setGooglePayAvailable(false)
    setAttempt((a) => a + 1)
  }

  if (!showCheckout) {
    return (
      <button
        onClick={handleStartCheckout}
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
    )
  }

  return (
    <div className="w-full space-y-4">
      <p className="text-[11px] leading-snug text-muted-foreground text-center flex items-center justify-center gap-1.5 px-2">
        <Lock className="h-3 w-3 flex-shrink-0" />
        <span>{copy.securePayment}</span>
      </p>

      {children}

      {error && (
        <div className="space-y-3">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-800">{copy.errorTitle}</p>
                <p className="text-xs text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
          {!sdkReady && (
            <button
              onClick={handleRetry}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#FF6B00] hover:bg-[#e05e00] text-white font-bold text-base py-3 px-6 transition-colors duration-200"
            >
              <RefreshCw className="h-4 w-4" />
              {copy.tryAgain}
            </button>
          )}
        </div>
      )}

      {notice && !error && (
        <p className="rounded-lg bg-secondary/50 px-3 py-2 text-xs text-center text-muted-foreground">{notice}</p>
      )}

      {processing && (
        <div className="flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {copy.processing}
        </div>
      )}

      {!sdkReady && !error && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Payment buttons: full width of the card, same width, even spacing */}
      <div
        key={attempt}
        className={`flex w-full flex-col gap-2.5 ${processing ? "pointer-events-none opacity-50" : ""}`}
      >
        {/* Apple Pay / Google Pay (filled in by components/paypal-wallets.ts when eligible) */}
        <div ref={applePayRef} hidden={!applePayAvailable} style={{ width: "100%", minHeight: 48 }} />
        <div ref={googlePayRef} hidden={!googlePayAvailable} style={{ width: "100%", height: 48 }} />
        <paypal-button
          ref={paypalButtonRef}
          type="pay"
          hidden={!paypalAvailable || undefined}
          style={PAYPAL_BUTTON_STYLE}
        ></paypal-button>
        <paypal-basic-card-container hidden={!cardAvailable || undefined} style={PAYPAL_BUTTON_STYLE}>
          <paypal-basic-card-button
            ref={cardButtonRef}
            aria-label={copy.cardButtonLabel}
            style={PAYPAL_BUTTON_STYLE}
          ></paypal-basic-card-button>
        </paypal-basic-card-container>
      </div>
    </div>
  )
}
