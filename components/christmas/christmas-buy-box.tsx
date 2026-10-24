"use client"

import { useState } from "react"
import { formatGBP, formatPriceRange, type ChristmasProduct } from "@/lib/christmas"

export function ChristmasBuyBox({ product }: { product: ChristmasProduct }) {
  const [selected, setSelected] = useState(0)
  const optionPrice = product.options?.prices?.[selected]
  const priceLabel = optionPrice !== undefined ? formatGBP(optionPrice) : formatPriceRange(product)
  const available = priceLabel !== null

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

      <button
        type="button"
        disabled={!available}
        className="inline-flex h-12 items-center justify-center rounded-md bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {available ? "Add to basket" : "Coming soon"}
      </button>
    </div>
  )
}
