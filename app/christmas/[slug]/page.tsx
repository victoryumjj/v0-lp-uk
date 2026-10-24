import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Check } from "lucide-react"
import { christmasCategories, christmasProducts, getChristmasProduct } from "@/lib/christmas"
import { ChristmasGallery } from "@/components/christmas/christmas-gallery"
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
              <p className="text-xl font-medium">
                {product.price !== null ? `£${product.price.toFixed(2)}` : "Price coming soon"}
              </p>
            </div>

            {product.options && (
              <fieldset className="flex flex-col gap-3">
                <legend className="mb-3 text-sm font-medium">{product.options.label}</legend>
                <div className="flex flex-wrap gap-2">
                  {product.options.values.map((value, i) => (
                    <label key={value} className="cursor-pointer">
                      <input
                        type="radio"
                        name="option"
                        value={value}
                        defaultChecked={i === 0}
                        className="peer sr-only"
                      />
                      <span className="inline-flex h-10 items-center rounded-full border border-border px-4 text-sm transition-colors peer-checked:border-foreground peer-checked:bg-foreground peer-checked:text-background peer-focus-visible:ring-2 peer-focus-visible:ring-ring">
                        {value}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            <button
              type="button"
              disabled={product.price === null}
              className="inline-flex h-12 items-center justify-center rounded-md bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {product.price !== null ? "Add to basket" : "Coming soon"}
            </button>

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
