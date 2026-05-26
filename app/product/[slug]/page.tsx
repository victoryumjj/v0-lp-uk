import { notFound } from "next/navigation"
import { getProductBySlug, products, getProductsByCategory } from "@/lib/products"
import ClientProductPage from "./ClientProductPage"
import { TableauMadridPage } from "@/components/tableau-madrid-page"

export async function generateStaticParams() {
  return products.map((product) => ({
    slug: product.slug,
  }))
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = getProductBySlug(slug)

  if (!product) {
    notFound()
  }

  const relatedProducts = getProductsByCategory(product.category)
    .filter((p) => p.id !== product.id)
    .slice(0, 4)

  const decorAndLightingProducts = products
    .filter((p) => (p.category === "decor" || p.category === "lighting") && p.id !== product.id)
    .slice(0, 4)

  // Check if this is a French version product
  const isFrenchVersion = slug.endsWith("-fr")
  
  // Check if this is a UK version product (English with GBP)
  // Either by slug suffix OR by currency being GBP (for products like LED kit)
  const isUKVersion = slug.endsWith("-uk") || product.currency === "GBP"
  
  // Get products for "Frequently bought together" section (use French/UK/EN versions based on page)
  const wallCleanerProductId = isFrenchVersion 
    ? "prod_U2rvHwRWU8IYTd" 
    : isUKVersion 
      ? "prod_UK_wall_cleaner" 
      : "prod_U2rvasMPkTpnoe"
  const ledStripProductId = isFrenchVersion 
    ? "prod_U2rv6g1To7VPTZ" 
    : isUKVersion 
      ? "prod_UK_led_strip" 
      : "prod_U2rv1ALPGyHHs7"
  
  const wallCleanerProduct = products.find((p) => p.id === wallCleanerProductId && p.id !== product.id)
  const ledStripProduct = products.find((p) => p.id === ledStripProductId && p.id !== product.id)
  const frequentlyBoughtTogether = [wallCleanerProduct, ledStripProduct].filter(Boolean) as typeof products
  const frequentlyBoughtTotal = frequentlyBoughtTogether.reduce((sum, p) => sum + p.price, 0)
  
  // Combine products for "You Might Also Like" - excluding Frequently bought together items and removing duplicates
  const excludeIds = ["prod_U2rvasMPkTpnoe", "prod_U2rv1ALPGyHHs7"]
  const seenIds = new Set<string>()
  const orderBumpProducts = [
    ...relatedProducts.filter((p) => !excludeIds.includes(p.id)),
    ...decorAndLightingProducts.filter((p) => !excludeIds.includes(p.id)),
  ].filter((p) => {
    if (seenIds.has(p.id)) return false
    seenIds.add(p.id)
    return true
  }).slice(0, 6)

  const isFlexibleAcousticPanel = product.id === "prod_U4kuSjp9pwoOzo" || product.id === "prod_U2rumuoWXebtgj" || product.id === "prod_UK_flexible_acoustic"
  const isRecessedLedStrip = product.slug === "recessed-led-strip-lighting" || product.slug === "recessed-led-strip-lighting-fr"
  const isTableauMadrid = product.id === "prod_U2rvgYxfRGaGl7"

  const discountPercent =
    product.onSale && product.originalPrice
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0

  // Tableau Madrid has a dedicated page component with size/frame/color selectors
  if (isTableauMadrid) {
    return <TableauMadridPage product={product} />
  }

  return (
    <ClientProductPage 
      product={product} 
      relatedProducts={relatedProducts} 
      decorAndLightingProducts={decorAndLightingProducts} 
      frequentlyBoughtTogether={frequentlyBoughtTogether} 
      frequentlyBoughtTotal={frequentlyBoughtTotal} 
      orderBumpProducts={orderBumpProducts} 
      isFlexibleAcousticPanel={isFlexibleAcousticPanel}
      isRecessedLedStrip={isRecessedLedStrip}
      discountPercent={discountPercent}
      isFrenchVersion={isFrenchVersion}
      isUKVersion={isUKVersion}
    />
  )
}
