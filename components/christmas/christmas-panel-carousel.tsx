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
      className="mt-8 overflow-hidden rounded-md border border-border/60 bg-card px-4 py-8 sm:px-6"
    >
      <div className="flex flex-col gap-3">
        <ChristmasEyebrow />
        <h2 id="christmas-panel-title" className="font-serif text-2xl text-balance sm:text-3xl">
          Make your new wall feel like Christmas
        </h2>
        <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
          Garlands, baubles and lights that look beautiful against warm wood slats.
        </p>
      </div>

      <ul className="mt-6 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:none]">
        {items.map((product) => (
          <li key={product.slug} className="w-[calc((100%-0.75rem)/2.3)] shrink-0 snap-start sm:w-40">
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
