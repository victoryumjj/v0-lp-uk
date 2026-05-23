"use client"

import Image from "next/image"
import Link from "next/link"
import { Minus, Plus, X } from "lucide-react"
import type { CartItem as CartItemType } from "@/lib/cart-context"
import { useCart } from "@/lib/cart-context"
import { formatPrice, clampQuantity } from "@/lib/price"
import { Button } from "@/components/ui/button"

interface CartItemProps {
  item: CartItemType
}

export function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCart()
  const { product, quantity } = item

  const handleQuantityChange = (delta: number) => {
    const newQuantity = clampQuantity(quantity + delta, 1, 100)
    if (newQuantity !== quantity) {
      updateQuantity(product.id, newQuantity)
    }
  }

  const itemTotal = formatPrice(product.price * quantity, product.currency || "EUR")

  return (
    <div className="flex gap-4 py-6">
      {/* Image */}
      <Link href={`/product/${product.slug}`} className="h-24 w-24 shrink-0 overflow-hidden bg-secondary block">
        <Image
          src={product.images[0] || "/placeholder.svg"}
          alt={product.name}
          width={96}
          height={96}
          className="w-full h-full object-cover"
          sizes="96px"
        />
      </Link>

      {/* Details */}
      <div className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link href={`/product/${product.slug}`} className="font-medium hover:underline">
              {product.name}
            </Link>
            <p className="mt-1 text-sm text-muted-foreground line-clamp-1">{product.description}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={() => removeItem(product.id)}
            aria-label={`Remove ${product.name} from cart`}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-auto flex items-center justify-between pt-4">
          {/* Quantity */}
          <div className="flex items-center border border-border">
            <button
              type="button"
              onClick={() => handleQuantityChange(-1)}
              disabled={quantity <= 1}
              className="flex h-8 w-8 items-center justify-center transition-colors hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Decrease quantity"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="w-8 text-center text-sm font-medium">{quantity}</span>
            <button
              type="button"
              onClick={() => handleQuantityChange(1)}
              disabled={quantity >= 100}
              className="flex h-8 w-8 items-center justify-center transition-colors hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Increase quantity"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          <p className="font-serif text-lg">{itemTotal}</p>
        </div>
      </div>
    </div>
  )
}
