import Image from "next/image"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatPriceRange, getChristmasCategory, type ChristmasProduct } from "@/lib/christmas"

const tileClass = {
  sage: "bg-tile-sage",
  blush: "bg-tile-blush",
  sand: "bg-tile-sand",
} as const

interface ChristmasProductCardProps {
  product: ChristmasProduct
  showCategory?: boolean
  size?: "default" | "compact"
}

export function ChristmasProductCard({ product, showCategory = false, size = "default" }: ChristmasProductCardProps) {
  const category = getChristmasCategory(product.category)
  const image = product.images[0]

  return (
    <article className="group flex flex-col gap-2">
      <div className={cn("relative aspect-square overflow-hidden rounded-sm", tileClass[category.tile])}>
        {image ? (
          <Image
            src={image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center" aria-hidden="true">
            <Star className="h-5 w-5 text-festive/30" strokeWidth={1.25} />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1 pt-1">
        {showCategory && (
          <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {category.name}
          </span>
        )}
        <h3
          className={cn(
            "text-pretty leading-snug text-foreground",
            size === "compact" ? "text-xs" : "text-sm",
          )}
        >
          {product.name}
        </h3>
        <p className={cn("font-semibold text-foreground", size === "compact" ? "text-xs" : "text-sm")}>
          {formatPriceRange(product) ?? (
            <span className="font-normal text-muted-foreground">Price coming soon</span>
          )}
        </p>
      </div>
    </article>
  )
}
