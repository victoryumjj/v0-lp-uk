import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid min-h-[90vh] items-center gap-12 py-16 lg:grid-cols-2 lg:gap-20 lg:py-24">
          {/* Content */}
          <div className="flex flex-col justify-center">
            <span className="mb-6 inline-flex w-fit items-center border-b border-accent/30 pb-2 text-xs font-medium uppercase tracking-[0.2em] text-accent">
              New Collection 2026
            </span>
            <h1 className="font-serif text-4xl font-normal leading-[1.1] tracking-tight text-balance sm:text-5xl lg:text-6xl xl:text-7xl">
              Elevate Your Space with Timeless Design
            </h1>
            <p className="mt-8 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
              Discover our curated collection of wall panels, lighting and Scandinavian-inspired decor. Crafted with sustainable materials for the modern home.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Button asChild size="lg" className="h-14 px-10 text-sm font-medium uppercase tracking-wider">
                <Link href="/product/flexible-acoustic-panel-uk">
                  View Collection
                  <ArrowRight className="ml-3 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-14 border-foreground/20 px-10 text-sm font-medium uppercase tracking-wider bg-transparent hover:bg-foreground/5">
                <Link href="/about">Our Story</Link>
              </Button>
            </div>
            {/* Trust badges */}
            <div className="mt-16 flex flex-wrap items-center gap-10 border-t border-border/50 pt-10">
              <div className="flex flex-col gap-1">
                <span className="font-serif text-2xl font-normal">Free</span>
                <span className="text-xs uppercase tracking-wider text-muted-foreground">UK Delivery</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-serif text-2xl font-normal">30 Days</span>
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Returns</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-serif text-2xl font-normal">5 Years</span>
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Warranty</span>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative aspect-[4/5] overflow-hidden lg:aspect-auto lg:h-[85vh]">
            <Image
              src="/hero-scandinavian-living-room-wood-panels.jpg"
              alt="Modern Scandinavian living room with wood wall panels"
              width={800}
              height={1000}
              className="w-full h-full object-cover transition-transform duration-700 hover:scale-[1.02]"
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/10 to-transparent" />
          </div>
        </div>
      </div>
    </section>
  )
}
