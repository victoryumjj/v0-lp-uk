import Link from "next/link"
import { Button } from "@/components/ui/button"
import { christmasCategories, getFeaturedChristmasProducts } from "@/lib/christmas"
import { ChristmasEyebrow } from "./christmas-eyebrow"
import { ChristmasProductCard } from "./christmas-product-card"

export function ChristmasHomeSection() {
  const featured = getFeaturedChristmasProducts()

  return (
    <section aria-labelledby="christmas-home-title" className="border-y border-border/60 bg-card py-16 lg:py-24">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex max-w-xl flex-col gap-4">
            <ChristmasEyebrow />
            <h2 id="christmas-home-title" className="font-serif text-3xl text-balance sm:text-4xl lg:text-5xl">
              The Christmas Collection
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              Trees, baubles, garlands and lights chosen to sit beautifully against warm wood walls.
            </p>
          </div>
          <Button asChild size="lg" className="h-12 w-full bg-accent px-8 text-accent-foreground hover:bg-accent/90 sm:w-fit">
            <Link href="/christmas">Shop the collection</Link>
          </Button>
        </div>

        <nav aria-label="Christmas categories" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <ul className="flex w-max gap-2">
            {christmasCategories.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/christmas?category=${category.id}`}
                  className="inline-flex h-9 items-center rounded-full border border-border px-4 text-sm text-foreground transition-colors hover:border-foreground"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4 lg:gap-6">
          {featured.map((product) => (
            <Link key={product.slug} href={`/christmas?category=${product.category}`} className="block">
              <ChristmasProductCard product={product} showCategory />
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
