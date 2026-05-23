"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const categories = [
  { id: "wall-panels", name: "Wall Panels", slug: "wall-panels" },
  { id: "lighting", name: "Lighting", slug: "lighting" },
  { id: "decor", name: "Decor", slug: "decor" },
]

export function ProductFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentCategory = searchParams.get("category")

  const handleCategoryChange = (categorySlug: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (categorySlug) {
      params.set("category", categorySlug)
    } else {
      params.delete("category")
    }
    router.push(`/products?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleCategoryChange(null)}
        className={cn(
          "rounded-full bg-transparent",
          !currentCategory && "bg-foreground text-background hover:bg-foreground/90 hover:text-background",
        )}
      >
        All
      </Button>
      {categories.map((category) => (
        <Button
          key={category.id}
          variant="outline"
          size="sm"
          onClick={() => handleCategoryChange(category.slug)}
          className={cn(
            "rounded-full bg-transparent",
            currentCategory === category.slug &&
              "bg-foreground text-background hover:bg-foreground/90 hover:text-background",
          )}
        >
          {category.name}
        </Button>
      ))}
    </div>
  )
}
