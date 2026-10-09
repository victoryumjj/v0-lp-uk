"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, ShoppingBag, AlertTriangle } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { CartItem } from "@/components/cart-item"
import { Button } from "@/components/ui/button"
import { StripeCheckoutFr } from "@/components/stripe-checkout-fr"
import { isUKItem } from "@/lib/checkout/market"
import { formatPrice } from "@/lib/price"
import { trackInitiateCheckout, generateEventId } from "@/lib/meta-pixel"
import { getFbpFbc } from "@/lib/fbp-fbc"
import { getStoredUTMs } from "@/lib/utm-client"
import { BonusProgressBar } from "@/components/bonus-progress-bar"

export default function CartPage() {
  const { items, totalPrice, clearCart } = useCart()
  const router = useRouter()

  // UK (GBP) products are never charged in EUR: send them to the UK cart
  const hasUKItems = items.some(isUKItem)
  useEffect(() => {
    if (hasUKItems) router.replace("/cart-uk")
  }, [hasUKItems, router])

  const hasFlexiblePanel = items.some((item) => item.product.slug === "flexible-acoustic-panel-fr")
  
  // Check if cart has products with mixed currencies (should never happen, but validate)
  const currencies = items.map((item) => item.product.currency || "EUR")
  const uniqueCurrencies = [...new Set(currencies)]
  const hasMixedCurrencies = uniqueCurrencies.length > 1

  // All products should be EUR for French market
  const currencyCode = "EUR"

  // Format prices using utility function to avoid floating point errors
  const formattedTotal = formatPrice(totalPrice, currencyCode)

  const handleInitiateCheckout = () => {
    const eventId = generateEventId("ic")
    const contentIds = items.map((item) => item.product.id)
    const numItems = items.reduce((sum, item) => sum + item.quantity, 0)

    trackInitiateCheckout({
      contentIds,
      numItems,
      value: totalPrice,
      currency: currencyCode,
      eventId,
    })

    // Send CAPI event
    const { fbp, fbc } = getFbpFbc()
    const utms = getStoredUTMs()

    fetch("/api/meta/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventName: "InitiateCheckout",
        eventId,
        pageUrl: window.location.href,
        customData: {
          content_ids: contentIds,
          num_items: numItems,
          value: totalPrice,
          currency: currencyCode,
          ...utms,
        },
        fbp,
        fbc,
      }),
    }).catch(console.error)
  }

  if (items.length === 0) {
    return (
      <div className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-md text-center">
            <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground" />
            <h1 className="mt-6 font-serif text-3xl">Votre panier est vide</h1>
            <p className="mt-4 text-muted-foreground">{"Il semble que vous n'ayez pas encore ajoute d'articles a votre panier."}</p>
            <Button asChild className="mt-8" size="lg">
              <Link href="/products">
                Continuer les achats
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Continuer les achats
          </Link>
          <h1 className="mt-4 font-serif text-4xl">Votre Panier</h1>
        </div>

        {hasFlexiblePanel && (
          <div className="mb-8 flex items-center gap-3 rounded-md bg-amber-50 border border-amber-200 px-4 py-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Les articles dans votre panier se vendent vite !</p>
              <p className="text-xs text-amber-700">
                Seulement 30 unites de Panneau Acoustique Flexible restantes. Finalisez votre commande maintenant.
              </p>
            </div>
          </div>
        )}

        {hasMixedCurrencies && (
          <div className="mb-8 flex items-center gap-3 rounded-md bg-red-50 border border-red-200 px-4 py-3">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-800">Panier invalide</p>
              <p className="text-xs text-red-700">
                Votre panier contient des produits de differents marches. Veuillez vider votre panier et selectionner des produits du meme marche.
              </p>
            </div>
          </div>
        )}

        {/* Bonus Progress Bar - Unlock at €100 */}
        <BonusProgressBar currentTotal={totalPrice} threshold={100} className="mb-8" />

        <div className="grid gap-12 lg:grid-cols-3">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="divide-y divide-border border-y border-border">
              {items.map((item) => (
                <CartItem key={item.product.id} item={item} />
              ))}
            </div>

            {/* Clear Cart */}
            <div className="mt-6">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground" onClick={clearCart}>
                Vider le Panier
              </Button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-secondary p-6">
              <h2 className="font-serif text-xl">Resume de la Commande</h2>

              <div className="mt-6 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sous-total</span>
                  <span>{formatPrice(totalPrice, currencyCode)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Livraison</span>
                  <span>Calcule a la caisse</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">TVA</span>
                  <span>Calcule a la caisse</span>
                </div>
              </div>

              <div className="mt-6 border-t border-border pt-6">
                <div className="flex justify-between">
                  <span className="font-medium">Total</span>
                  <span className="font-serif text-xl">{formattedTotal}</span>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {hasMixedCurrencies ? (
                  <div className="text-center text-sm text-red-600 font-semibold p-4 bg-red-50 rounded">
                    Veuillez vider votre panier pour proceder au paiement
                  </div>
                ) : (
                  <StripeCheckoutFr items={items} onInitiateCheckout={handleInitiateCheckout} />
                )}
              </div>

              <p className="mt-4 text-center text-xs text-muted-foreground">Paiement securise par Stripe</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
