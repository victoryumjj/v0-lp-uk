"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Check } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { christmasCartId, formatGBP, formatPriceRange, type ChristmasProduct } from "@/lib/christmas"

export function ChristmasBuyBox({ product }: { product: ChristmasProduct }) {
  const { addItem } = useCart()
  const [selected, setSelected] = useState(0)
  const [added, setAdded] = useState(false)
  const optionPrice = product.options?.prices?.[selected]
  const priceLabel = optionPrice !== undefined ? formatGBP(optionPrice) : formatPriceRange(product)
  const unitPrice = optionPrice ?? product.price
  const available = unitPrice !== null && priceLabel !== null

  useEffect(() => {
    if (!added) return
    const timer = setTimeout(() => setAdded(false), 2500)
    return () => clearTimeout(timer)
  }, [added])

  const handleAdd = () => {
    if (unitPrice === null) return
    const hasOptionPrice = optionPrice !== undefined
    const optionValue = hasOptionPrice ? product.options?.values[selected] : undefined
    addItem(
      {
        id: christmasCartId(product.slug, hasOptionPrice ? selected : undefined),
        slug: product.slug,
        name: optionValue ? `${product.name} – ${optionValue}` : product.name,
        description: product.description ?? product.name,
        longDescription: "",
        price: unitPrice,
        currency: "GBP",
        category: "christmas",
        images: product.images,
        features: [],
        inStock: true,
      },
      1,
    )
    setAdded(true)
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

      <div className="flex flex-col gap-3">
        <button
          type="button"
          disabled={!available}
          onClick={handleAdd}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {added && <Check className="h-4 w-4" aria-hidden="true" />}
          {!available ? "Coming soon" : added ? "Added to basket" : "Add to basket"}
        </button>
        <p className="sr-only" aria-live="polite">
          {added ? `${product.name} added to your basket` : ""}
        </p>
        {added && (
          <Link
            href="/cart-uk"
            className="inline-flex h-12 items-center justify-center rounded-md border border-border px-6 text-sm font-medium transition-colors hover:bg-secondary"
          >
            View basket
          </Link>
        )}
      </div>
    </div>
  )
}
