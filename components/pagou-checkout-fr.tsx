"use client"

import { PagouCheckout, type CheckoutItem } from "@/components/pagou-checkout"

const COPY = {
  confirmButton: "Confirmer ma commande",
  loading: "Redirection vers le paiement securise...",
  securePayment: "Paiement 100% Securise SSL - Visa, Mastercard, American Express",
  errorTitle: "Une erreur est survenue",
  genericError: "Le paiement n'a pas pu demarrer. Veuillez reessayer.",
}

interface PagouCheckoutFrProps {
  items: CheckoutItem[]
  onInitiateCheckout?: () => void
  /** Kept for compatibility with the checkout page; the bonus is shown on the page itself */
  bonusData?: unknown
}

export function PagouCheckoutFr({ items, onInitiateCheckout }: PagouCheckoutFrProps) {
  return <PagouCheckout market="FR" items={items} onInitiateCheckout={onInitiateCheckout} copy={COPY} />
}
