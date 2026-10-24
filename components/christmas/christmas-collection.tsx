"use client"

import { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { christmasCategories, christmasProducts, type ChristmasCategoryId } from "@/lib/christmas"
import { ChristmasProductCard } from "./christmas-product-card"

type Filter = ChristmasCategoryId | "all"

export function ChristmasCollection({ initialCategory = "all" }: { initialCategory?: Filter }) {
  const [filter, setFilter] = useState<Filter>(initialCategory)

  const visibleCategories =
    filter === "all" ? christmasCategories : christmasCategories.filter((c) => c.id === filter)

  const chips: { id: Filter; name: string }[] = [{ id: "all", name: "All" }, ...christmasCategories]

  return (
    <div className="flex flex-col gap-12">
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="group" aria-label="Filter by category">
        <div className="flex w-max gap-2">
          {chips.map((chip) => {
            const active = filter === chip.id
            return (
              <button
                key={chip.id}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setFilter(chip.id)
                  const url = chip.id === "all" ? "/christmas" : `/christmas?category=${chip.id}`
                  window.history.replaceState(null, "", url)
                }}
                className={cn(
                  "inline-flex h-9 items-center rounded-full border px-4 text-sm transition-colors",
                  active
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-transparent text-foreground hover:border-foreground",
                )}
              >
                {chip.name}
              </button>
            )
          })}
        </div>
      </div>

      {visibleCategories.map((category) => {
        const items = christmasProducts.filter((p) => p.category === category.id)
        return (
          <section key={category.id} aria-labelledby={`cat-${category.id}`} className="flex flex-col gap-5">
            <h2 id={`cat-${category.id}`} className="font-serif text-2xl sm:text-3xl">
              {category.name}
            </h2>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-5 lg:gap-6">
              {items.map((product) => (
                <li key={product.slug}>
                  <Link href={`/christmas/${product.slug}`} className="block">
                    <ChristmasProductCard product={product} />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
