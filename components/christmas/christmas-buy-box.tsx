"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { RotateCcw, Shield, ShoppingCart, Truck } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { useToast } from "@/hooks/use-toast"
import { christmasCartId, formatGBP, formatPriceRange, type ChristmasProduct } from "@/lib/christmas"

const MAX_QUANTITY = 99

export function ChristmasBuyBox({ product }: { product: ChristmasProduct }) {
  const router = useRouter()
  const { addItem } = useCart()
  const { toast } = useToast()
  const [selected, setSelected] = useState(0)
  const [quantity, setQuantity] = useState(1)

  const optionPrice = product.options?.prices?.[selected]
  const priceLabel = optionPrice !== undefined ? formatGBP(optionPrice) : formatPriceRange(product)
  const unitPrice = optionPrice ?? product.price
  const available = unitPrice !== null && priceLabel !== null
  const totalPrice = unitPrice !== null ? unitPrice * quantity : 0

  const addToCart = () => {
    if (unitPrice === null) return null
    const hasOptionPrice = optionPrice !== undefined
    const optionValue = hasOptionPrice ? product.options?.values[selected] : undefined
    const id = christmasCartId(product.slug, hasOptionPrice ? selected : undefined)
    const name = optionValue ? `${product.name} – ${optionValue}` : product.name
    addItem(
      {
        id,
        slug: product.slug,
        name,
        description: product.description ?? product.name,
        longDescription: "",
        price: unitPrice,
        currency: "GBP",
        category: "christmas",
        images: product.images,
        features: [],
        inStock: true,
      },
      quantity,
    )
    return { id, name }
  }

  const handleAddToCart = () => {
    if (!addToCart()) return
    toast({
      title: "Added to cart!",
      description: `${quantity} ${quantity > 1 ? "items" : "item"} added to your cart`,
    })
  }

  const handleBuyNow = () => {
    const added = addToCart()
    if (!added || unitPrice === null) return
    try {
      sessionStorage.setItem(
        "checkout_order_uk",
        JSON.stringify({
          productId: added.id,
          name: added.name,
          price: unitPrice,
          totalPrice,
          quantity,
          image: product.images[0] ?? "",
          currency: "GBP",
        }),
      )
    } catch {}
    router.push("/checkout-uk")
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-xl font-medium" aria-live="polite">
        {priceLabel ?? "Price coming soon"}
      </p>

      {product.options && (
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 text-sm font-medium">{product.options.label}</legend>
          <div className="flex flex-wrap gap-2">
            {product.options.values.map((value, i) => (
              <label key={value} className="cursor-pointer">
                <input
                  type="radio"
                  name="option"
                  value={value}
                  checked={selected === i}
                  onChange={() => setSelected(i)}
                  className="peer sr-only"
                />
                <span className="inline-flex h-10 items-center rounded-full border border-border px-4 text-sm transition-colors peer-checked:border-foreground peer-checked:bg-foreground peer-checked:text-background peer-focus-visible:ring-2 peer-focus-visible:ring-ring">
                  {value}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div className="flex w-full flex-col items-center gap-3">
        <div className="flex items-center overflow-hidden rounded-xl border border-gray-300">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="flex h-14 w-14 items-center justify-center text-2xl text-gray-600 transition-colors hover:bg-gray-100"
          >
            −
          </button>
          <span
            className="flex h-14 w-14 items-center justify-center text-xl font-semibold text-gray-900"
            aria-live="polite"
            aria-label={`Quantity ${quantity}`}
          >
            {quantity}
          </span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => setQuantity((q) => Math.min(MAX_QUANTITY, q + 1))}
            className="flex h-14 w-14 items-center justify-center text-2xl text-gray-600 transition-colors hover:bg-gray-100"
          >
            +
          </button>
        </div>

        <button
          type="button"
          disabled={!available}
          onClick={handleAddToCart}
          className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ShoppingCart className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          Add to Cart
        </button>

        <button
          type="button"
          disabled={!available}
          onClick={handleBuyNow}
          className="flex w-full items-center justify-center gap-3 rounded-full bg-[#FF6B00] px-8 py-4 text-lg font-semibold text-white transition-colors duration-200 hover:bg-[#e05e00] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ShoppingCart className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
          {available ? `Buy Now - £${totalPrice.toFixed(2)}` : "Coming soon"}
        </button>

        <p className="text-center text-xs text-muted-foreground">
          Dispatch within 24-48h • Estimated delivery 5-8 business days
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 border-t border-border pt-8">
        <div className="flex flex-col items-center text-center">
          <Truck className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <span className="mt-2 text-[10px] leading-tight text-muted-foreground sm:text-xs">
            Free Shipping
            <br className="sm:hidden" /> Over £80
          </span>
        </div>
        <div className="flex flex-col items-center text-center">
          <RotateCcw className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <span className="mt-2 text-[10px] leading-tight text-muted-foreground sm:text-xs">30-Day Returns</span>
        </div>
        <div className="flex flex-col items-center text-center">
          <Shield className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <span className="mt-2 text-[10px] leading-tight text-muted-foreground sm:text-xs">5-Year Warranty</span>
        </div>
      </div>
    </div>
  )
}
