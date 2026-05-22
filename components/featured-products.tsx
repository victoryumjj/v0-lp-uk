import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { getFeaturedProductsUKMarket } from "@/lib/products"
import { ProductCard } from "./product-card"
import { Button } from "@/components/ui/button"

export function FeaturedProducts() {
  const featured = getFeaturedProductsUKMarket()

  return (
    <section className="bg-secondary/30 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <span className="mb-4 inline-block text-xs font-medium uppercase tracking-[0.2em] text-accent">Selection</span>
            <h2 className="font-serif text-3xl font-normal sm:text-4xl lg:text-5xl">Featured Collection</h2>
            <p className="mt-5 max-w-xl text-muted-foreground">
              Our most loved pieces, selected for their exceptional craftsmanship and design.
            </p>
          </div>
          <Button asChild variant="ghost" className="group text-sm font-medium uppercase tracking-wider">
            <Link href="/products">
              View All
              <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((product, index) => (
            <ProductCard key={product.id} product={product} priority={index < 3} />
          ))}
        </div>
      </div>
    </section>
  )
}
