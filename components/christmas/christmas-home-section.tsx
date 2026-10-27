import Link from "next/link"
import { Button } from "@/components/ui/button"
import { christmasCategories, getFeaturedChristmasProducts } from "@/lib/christmas"
import { ChristmasEyebrow } from "./christmas-eyebrow"
import { ChristmasProductCard } from "./christmas-product-card"

export function ChristmasHomeSection() {
  const featured = getFeaturedChristmasProducts()

  return (
    <section aria-labelledby="christmas-home-title" className="px-3 py-12 sm:px-4 lg:px-6 lg:py-16">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 rounded-[40px] bg-card px-5 py-12 shadow-[0_8px_30px_rgb(51_37_28/0.06)] sm:px-8 lg:px-12 lg:py-16">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex max-w-xl flex-col gap-4">
            <ChristmasEyebrow />
            <h2 id="christmas-home-title" className="font-serif text-4xl font-medium text-balance sm:text-5xl lg:text-6xl">
              The Christmas Collection
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              Trees, baubles, garlands and lights chosen to sit beautifully against warm wood walls.
            </p>
          </div>
          <Button asChild size="lg" className="h-12 w-full px-8 sm:w-fit">
            <Link href="/christmas">Shop the collection</Link>
          </Button>
        </div>

        <nav aria-label="Christmas categories">
          <ul className="flex flex-wrap gap-2">
            {christmasCategories.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/christmas?category=${category.id}`}
                  className="inline-flex h-11 items-center whitespace-nowrap rounded-full border border-border bg-background px-5 text-sm font-medium text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4 lg:gap-6">
          {featured.map((product) => (
            <Link key={product.slug} href={`/christmas/${product.slug}`} className="block">
              <ChristmasProductCard product={product} showCategory />
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
