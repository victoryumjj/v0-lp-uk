import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Check } from "lucide-react"
import { christmasCategories, christmasProducts, getChristmasProduct } from "@/lib/christmas"
import { ChristmasGallery } from "@/components/christmas/christmas-gallery"
import { ChristmasBuyBox } from "@/components/christmas/christmas-buy-box"
import { ChristmasProductCard } from "@/components/christmas/christmas-product-card"

export function generateStaticParams() {
  return christmasProducts.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const product = getChristmasProduct(slug)
  if (!product) return { title: "Christmas | SLATURA WOOD" }
  return {
    title: `${product.name} | Christmas | SLATURA WOOD`,
    description: product.description ?? `${product.name} from the Slatura Wood Christmas Collection.`,
  }
}

export default async function ChristmasProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = getChristmasProduct(slug)
  if (!product) notFound()

  const category = christmasCategories.find((c) => c.id === product.category)
  const related = christmasProducts.filter((p) => p.category === product.category && p.slug !== product.slug).slice(0, 4)

  return (
    <div className="py-8 lg:py-14">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <li>
              <Link href="/" className="hover:text-foreground">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/christmas" className="hover:text-foreground">
                Christmas
              </Link>
            </li>
            {category && (
              <>
                <li aria-hidden="true">/</li>
                <li>
                  <Link href={`/christmas?category=${category.id}`} className="hover:text-foreground">
                    {category.name}
                  </Link>
                </li>
              </>
            )}
          </ol>
        </nav>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
          <ChristmasGallery images={product.images} name={product.name} />

          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              {category && (
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{category.name}</p>
              )}
              <h1 className="font-serif text-3xl text-balance sm:text-4xl">{product.name}</h1>
            </div>

            <ChristmasBuyBox product={product} />

            <ul className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
              <li>Free UK delivery</li>
              <li>30-day returns</li>
              <li>Secure checkout</li>
            </ul>

            {product.description && (
              <div className="flex flex-col gap-3 border-t border-border pt-6">
                <h2 className="font-serif text-xl">Description</h2>
                <p className="leading-relaxed text-muted-foreground text-pretty">{product.description}</p>
              </div>
            )}

            {product.details && (
              <div className="flex flex-col gap-3 border-t border-border pt-6">
                <h2 className="font-serif text-xl">Details</h2>
                <ul className="flex flex-col gap-2">
                  {product.details.map((d) => (
                    <li key={d} className="flex items-start gap-2 text-sm leading-relaxed">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {related.length > 0 && (
          <section aria-labelledby="related" className="flex flex-col gap-5 border-t border-border pt-10">
            <h2 id="related" className="font-serif text-2xl">
              More in {category?.name}
            </h2>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4 lg:gap-6">
              {related.map((p) => (
                <li key={p.slug}>
                  <Link href={`/christmas/${p.slug}`} className="block">
                    <ChristmasProductCard product={p} />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  )
}
