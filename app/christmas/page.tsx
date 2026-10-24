import type { Metadata } from "next"
import Link from "next/link"
import { isChristmasCategory } from "@/lib/christmas"
import { ChristmasCollection } from "@/components/christmas/christmas-collection"

export const metadata: Metadata = {
  title: "The Christmas Collection | SLATURA WOOD",
  description:
    "Trees, baubles, garlands and lights chosen to sit beautifully against warm wood walls. Shop the Slatura Wood Christmas Collection 2026.",
}

export default async function ChristmasPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams
  const initialCategory = isChristmasCategory(category) ? category : "all"

  return (
    <div className="py-10 lg:py-16">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-xs text-muted-foreground">
            <li>
              <Link href="/" className="hover:text-foreground">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-foreground">
              Christmas
            </li>
          </ol>
        </nav>

        <header className="flex max-w-2xl flex-col gap-4">
          <h1 className="font-serif text-4xl text-balance sm:text-5xl">The Christmas Collection</h1>
          <p className="leading-relaxed text-muted-foreground">
            Trees, baubles, garlands and lights chosen to sit beautifully against warm wood walls. Order early for
            delivery before Christmas.
          </p>
        </header>

        <ChristmasCollection key={initialCategory} initialCategory={initialCategory} />
      </div>
    </div>
  )
}
