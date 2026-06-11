import { Suspense } from "react"
import { CheckoutContent } from "@/components/checkout-content"
import { TikTokCheckout } from "@/components/tiktok-checkout"

export default function CheckoutPage() {
  return (
    <>
      <Suspense fallback={null}>
        <TikTokCheckout />
      </Suspense>
      <Suspense fallback={null}>
        <CheckoutContent />
      </Suspense>
    </>
  )
}
