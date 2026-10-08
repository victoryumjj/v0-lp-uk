"use client"

import { PagouCheckout, type CheckoutItem } from "@/components/pagou-checkout"

const COPY = {
  confirmButton: "Confirm My Order",
  loading: "Redirecting to secure payment...",
  securePayment: "100% SSL Secure Payment - Visa, Mastercard, American Express",
  errorTitle: "An error occurred",
  genericError: "We couldn't start the payment. Please try again.",
}

interface PagouCheckoutUKProps {
  items: CheckoutItem[]
  onInitiateCheckout?: () => void
  /** Kept for compatibility with the checkout page; the bonus is shown on the page itself */
  bonusData?: unknown
}

export function PagouCheckoutUK({ items, onInitiateCheckout }: PagouCheckoutUKProps) {
  return <PagouCheckout market="UK" items={items} onInitiateCheckout={onInitiateCheckout} copy={COPY} />
}
