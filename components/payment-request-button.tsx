"use client"

import { useEffect, useRef, useState } from "react"
import { loadStripe } from "@stripe/stripe-js"

interface PaymentRequestButtonProps {
  amount: number
  items: Array<{ name: string; quantity: number }>
  onSuccess?: (paymentIntent: any) => void
  onError?: (error: string) => void
  currency?: "GBP" | "EUR"
}

export function PaymentRequestButton({ amount, items, onSuccess, onError, currency = "GBP" }: PaymentRequestButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initPaymentRequest = async () => {
      try {
        const stripe = await loadStripe(
          process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_atio_STRIPE_PUBLISHABLE_KEY!,
        )

        if (!stripe) {
          throw new Error("Stripe failed to load")
        }

        const elements = stripe.elements()

        const paymentRequest = stripe.paymentRequest({
          country: currency === "EUR" ? "FR" : "GB",
          currency: currency.toLowerCase(),
          total: {
            label: "Total",
            amount: Math.round(amount * 100), // Convert to pence
          },
          requestPayerName: true,
          requestPayerEmail: true,
          displayItems: items.map((item) => ({
            label: item.name,
            amount: Math.round((amount / items.length) * 100), // Simplified distribution
          })),
        })

        const prButton = elements.create("paymentRequestButton", { paymentRequest })

        // Check if Payment Request is available
        const canMakePayment = await paymentRequest.canMakePayment()

        if (canMakePayment) {
          prButton.mount(containerRef.current!)
          setLoading(false)

          // Handle payment when user clicks
          paymentRequest.on("paymentmethod", async (ev) => {
            try {
              // Create PaymentIntent on backend
              const response = await fetch("/api/stripe/payment-intent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  amount,
                  currency: "gbp",
                }),
              })

              if (!response.ok) {
                const errorData = await response.json()
                ev.complete("fail")
                onError?.(errorData.error || "Failed to create payment intent")
                return
              }

              const data = await response.json()
              const { clientSecret } = data

              if (!clientSecret) {
                ev.complete("fail")
                onError?.("No client secret received from backend")
                return
              }

              // Confirm the payment with the PaymentMethod from Apple Pay
              const confirmResult = await stripe.confirmCardPayment(clientSecret, {
                payment_method: ev.paymentMethod.id,
              })

              const { paymentIntent, error } = confirmResult

              if (error) {
                ev.complete("fail")
                onError?.(error.message || "Payment failed")
                return
              }

              if (paymentIntent?.status === "succeeded" || paymentIntent?.status === "processing") {
                ev.complete("success")
                onSuccess?.(paymentIntent)
              } else if (paymentIntent?.status === "requires_action") {
                ev.complete("success")
                onSuccess?.(paymentIntent)
              } else {
                ev.complete("fail")
                onError?.(`Unexpected payment status: ${paymentIntent?.status}`)
              }
            } catch (error) {
              ev.complete("fail")
              onError?.(error instanceof Error ? error.message : "Payment failed - unknown error")
            }
          })
        } else {
          // Apple Pay/Google Pay not available on this device/browser
          setLoading(false)
          containerRef.current!.style.display = "none"
        }
      } catch (error) {
        onError?.(error instanceof Error ? error.message : "Failed to initialize payment")
        setLoading(false)
      }
    }

    if (containerRef.current) {
      initPaymentRequest()
    }
  }, [amount, items, onSuccess, onError])

  return (
    <div className="w-full space-y-3">
      {loading && <p className="text-sm text-muted-foreground text-center">Loading payment options...</p>}
      <div ref={containerRef} className="w-full" id="payment-request-button" />
    </div>
  )
}
