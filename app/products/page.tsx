import { Suspense } from "react"
import { getVisibleProductsUKMarket, getProductsByCategoryUKMarket } from "@/lib/products"
import { ProductCard } from "@/components/product-card"
import { ProductFilters } from "@/components/product-filters"

interface ProductsPageProps {
  searchParams: Promise<{ category?: string }>
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams
  const category = params.category
  const visibleProducts = getVisibleProductsUKMarket()
  const filteredProducts = category ? getProductsByCategoryUKMarket(category) : visibleProducts

  return (
    <div className="py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="font-serif text-4xl sm:text-5xl">Our Collection</h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Discover our selection of Scandinavian-inspired interior decor, crafted with care and built to last.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 border-b border-border pb-8">
          <Suspense fallback={<div className="h-9" />}>
            <ProductFilters />
          </Suspense>
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} priority={index < 4} />
            ))}
          </div>
        ) : (
          <div className="py-24 text-center">
            <p className="text-muted-foreground">No products found in this category.</p>
          </div>
        )}

        {/* Results count */}
        <div className="mt-12 border-t border-border pt-8">
          <p className="text-sm text-muted-foreground">
            Showing {filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"}
          </p>
        </div>
      </div>
    </div>
  )
}
