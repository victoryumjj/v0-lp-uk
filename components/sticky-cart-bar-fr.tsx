"use client"

import { useEffect, useState } from "react"
import { useCart } from "@/lib/cart-context"
import { useRouter, usePathname } from "next/navigation"
import { ShoppingCart, Lock } from "lucide-react"
import { trackInitiateCheckout, formatCartForTikTok } from "@/lib/tiktok-events"

interface StickyCartBarFrProps {
  selectedPrice?: number
  originalPrice?: number
}

export function StickyCartBarFr({ selectedPrice = 24.90, originalPrice = 29.80 }: StickyCartBarFrProps) {
  const [visible, setVisible] = useState(false)
  const { totalItems, totalPrice, items } = useCart()
  const router = useRouter()
  const pathname = usePathname()
  const hasItemsInCart = totalItems > 0
  
  // Hide sticky bar on checkout page
  const isCheckoutPage = pathname?.includes("/checkout")

  useEffect(() => {
    const heroBottom = document.querySelector("[data-add-to-cart]")
    if (!heroBottom) return

    const observer = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting), {
      threshold: 0,
    })
    observer.observe(heroBottom)
    return () => observer.disconnect()
  }, [])

  const handleChoosePack = () => {
    const addButton = document.querySelector("[data-add-to-cart]") as HTMLElement
    if (addButton) {
      addButton.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }

  const handleFinishOrder = async () => {
    // Track TikTok InitiateCheckout event BEFORE navigating to checkout
    if (items && items.length > 0) {
      try {
        const tiktokItems = formatCartForTikTok(items)
        await trackInitiateCheckout({
          contents: tiktokItems,
          value: totalPrice,
          currency: "EUR",
          description: `Checkout initiated with ${totalItems} items`,
        })
        if (process.env.NODE_ENV !== "production") {
          console.log("[v0] TikTok InitiateCheckout tracked:", { value: totalPrice, currency: "EUR", numItems: totalItems })
        }
      } catch (err) {
        console.error("[v0] Error tracking InitiateCheckout:", err)
      }
    }

    // Go directly to checkout
    router.push("/checkout-fr")
  }

  return (
    <div
      className={`fixed left-0 right-0 z-[9999] bg-[#2C1810] border-t border-white/10 px-4 py-3 transition-all duration-300 ${
        visible && hasItemsInCart && !isCheckoutPage ? "bottom-0" : "-bottom-20"
      }`}
      style={{ transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
    >
      <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-4 flex-wrap">
        {hasItemsInCart && (
          <>
            {/* Cart has items - show finalize order */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#C8522A]/20">
                <ShoppingCart className="w-5 h-5 text-[#C8522A]" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-[#FAF7F2]">{totalItems} article{totalItems > 1 ? "s" : ""} dans votre panier</span>
                <span className="text-xs text-[#FAF7F2]/60">Prêt à être expédié</span>
              </div>
            </div>

            {/* Total price */}
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-[#FAF7F2]">Total : {totalPrice.toFixed(2).replace(".", ",")} EUR</span>
            </div>

            {/* Finalize CTA */}
            <button
              type="button"
              onClick={handleFinishOrder}
              className="px-6 py-2.5 bg-[#22C55E] text-white rounded-lg text-sm font-medium whitespace-nowrap hover:bg-[#16A34A] active:scale-[0.97] transition-all flex-1 sm:flex-none text-center flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              Finaliser ma commande
            </button>
          </>
        )}
      </div>
    </div>
  )
}
