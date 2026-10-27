import Link from "next/link"
import Image from "next/image"
import { ArrowUpRight } from "lucide-react"

const categories = [
  {
    name: "Wall Panels",
    description: "Acoustic & decorative",
    href: "/products?category=wall-panels",
    image: "/category-wall-panels-oak-slat.jpg",
  },
  {
    name: "Lighting",
    description: "Lamps & fixtures",
    href: "/products?category=lighting",
    image: "/category-lighting-minimalist-lamp.jpg",
  },
  {
    name: "Decor",
    description: "Vases & objects",
    href: "/products?category=decor",
    image: "/category-decor-ceramic-vase.jpg",
  },
]

export function CategoriesSection() {
  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 text-center">
          <span className="mb-4 inline-block text-xs font-semibold uppercase tracking-[0.2em] text-accent">Browse</span>
          <h2 className="font-serif text-4xl font-medium sm:text-5xl lg:text-6xl">Shop by Category</h2>
          <p className="mx-auto mt-5 max-w-2xl text-muted-foreground">
            Explore our carefully curated collections, each designed to bring warmth and character to your interior.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link key={category.name} href={category.href} className="group relative block h-[420px] overflow-hidden rounded-[32px] lg:h-[460px]">
              <div className="absolute inset-0">
                <Image
                  src={category.image || "/placeholder.svg"}
                  alt={category.name}
                  fill
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
              <div className="glass absolute bottom-4 left-4 right-4 flex items-center justify-between gap-4 rounded-3xl p-5">
                <div>
                  <h3 className="font-serif text-3xl font-medium text-foreground">{category.name}</h3>
                  <p className="mt-1 text-sm uppercase tracking-wider text-muted-foreground">{category.description}</p>
                </div>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:rotate-45 motion-reduce:transition-none">
                  <ArrowUpRight className="h-5 w-5" aria-hidden="true" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
