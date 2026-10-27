import Link from "next/link"
import Image from "next/image"
import { ArrowRight, RotateCcw, ShieldCheck, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-background px-3 pt-3 sm:px-4 lg:px-6">
      <div className="relative flex min-h-[90vh] items-end overflow-hidden rounded-[40px] lg:items-center">
        {/* Hero Image */}
        <Image
          src="/hero-scandinavian-living-room-wood-panels.jpg"
          alt="Modern Scandinavian living room with wood wall panels"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/30 via-transparent to-transparent lg:bg-gradient-to-r lg:from-foreground/20" />

        <div className="relative mx-auto w-full max-w-7xl px-3 pb-3 pt-48 sm:px-6 sm:pb-6 lg:px-8 lg:py-24">
          {/* Content */}
          <div className="glass flex max-w-[600px] flex-col justify-center rounded-[40px] p-8 shadow-[0_20px_60px_rgb(51_37_28/0.15)] lg:p-12">
            <span className="mb-6 inline-flex w-fit items-center rounded-full bg-accent px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-accent-foreground">
              New Collection 2026
            </span>
            <h1 className="font-serif text-5xl font-medium leading-[1.05] tracking-tight text-balance text-foreground sm:text-6xl lg:text-7xl">
              Elevate Your Space with Timeless Design
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-foreground/80 sm:text-lg">
              Discover our curated collection of Scandinavian-inspired wall panels, lighting and decor. Crafted with sustainable materials for the modern home.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-14 px-8 text-sm">
                <Link href="/product/flexible-acoustic-panel-uk">
                  View Collection
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-14 border-white/70 bg-card px-8 text-sm hover:bg-white">
                <Link href="/christmas">Shop Christmas</Link>
              </Button>
            </div>
            {/* Trust badges */}
            <div className="mt-8 flex flex-wrap items-center gap-2">
              <div className="glass flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-card text-accent">
                  <Truck className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="text-sm font-semibold text-foreground">Free</span>
                <span className="text-xs uppercase tracking-wider text-muted-foreground">UK Delivery</span>
              </div>
              <div className="glass flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-card text-accent">
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="text-sm font-semibold text-foreground">30 Days</span>
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Returns</span>
              </div>
              <div className="glass flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-card text-accent">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="text-sm font-semibold text-foreground">5 Years</span>
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Warranty</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
