import Link from "next/link"
import { Button } from "@/components/ui/button"
import { christmasProducts } from "@/lib/christmas"
import { ChristmasEyebrow } from "./christmas-eyebrow"
import { ChristmasProductCard } from "./christmas-product-card"

const carouselSlugs = [
  "8ft-pre-lit-grand-fir-christmas-tree",
  "10-pack-flocked-oversized-shatterproof-baubles",
  "6ft-light-up-green-garland",
  "pre-lit-red-berry-garland",
  "300-bright-white-led-mains-lights",
  "real-winter-berry-wreath",
]

export function ChristmasPanelCarousel() {
  const items = carouselSlugs
    .map((slug) => christmasProducts.find((p) => p.slug === slug))
    .filter((p) => p !== undefined)

  return (
    <section
      aria-labelledby="christmas-panel-title"
      className="mt-12 border-y border-border/60 bg-card py-10 sm:mt-16 sm:rounded-sm sm:border sm:px-8"
    >
      <div className="flex flex-col gap-3 px-1 sm:px-0">
        <ChristmasEyebrow />
        <h2 id="christmas-panel-title" className="font-serif text-2xl text-balance sm:text-3xl">
          Make your new wall feel like Christmas
        </h2>
        <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
          Garlands, baubles and lights that look beautiful against warm wood slats.
        </p>
      </div>

      <ul className="-mx-4 mt-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0 [scrollbar-width:none]">
        {items.map((product) => (
          <li key={product.slug} className="w-[38%] shrink-0 snap-start sm:w-44">
            <Link href={`/christmas/${product.slug}`} className="block">
              <ChristmasProductCard product={product} size="compact" />
            </Link>
          </li>
        ))}
      </ul>

      <Button asChild variant="outline" className="mt-6 h-11 w-full bg-transparent">
        <Link href="/christmas">See the full Christmas collection</Link>
      </Button>
    </section>
  )
}
