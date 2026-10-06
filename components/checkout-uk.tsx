"use client"

import { PayPalCheckoutUK } from "@/components/paypal-checkout-uk"
import { PagouCheckout } from "@/components/pagou-checkout"
import type { PayPalCheckoutItem } from "@/components/paypal-checkout"

/**
 * Payment provider switch for the UK checkout.
 * NEXT_PUBLIC_CHECKOUT_PROVIDER = "pagou" → Pagou hosted checkout; anything else → PayPal.
 * Changing it requires a redeploy (it is read at build time).
 */
const PROVIDER = process.env.NEXT_PUBLIC_CHECKOUT_PROVIDER === "pagou" ? "pagou" : "paypal"

const PAGOU_COPY_UK = {
  confirmButton: "Confirm My Order",
  loading: "Redirecting to secure payment...",
  securePayment: "100% SSL Secure Payment - Visa, Mastercard, American Express",
  errorTitle: "An error occurred",
  genericError: "We couldn't start the payment. Please try again.",
}

interface CheckoutUKProps {
  items: PayPalCheckoutItem[]
  onInitiateCheckout?: () => void
  bonusData?: any
}

export function CheckoutUK({ items, onInitiateCheckout, bonusData }: CheckoutUKProps) {
  if (PROVIDER === "pagou") {
    return <PagouCheckout market="UK" items={items} onInitiateCheckout={onInitiateCheckout} copy={PAGOU_COPY_UK} />
  }
  return <PayPalCheckoutUK items={items} onInitiateCheckout={onInitiateCheckout} bonusData={bonusData} />
}
