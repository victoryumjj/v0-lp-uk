import { products } from "@/lib/products"

/** UK-only items that are not in lib/products (checkout upsells). */
const UK_EXTRA_IDS = new Set(["led-kit-uk", "glue-kit-uk"])

/**
 * True when the cart item belongs to the UK store (sold in GBP).
 * Looks the product up in the catalog, so items added without a currency
 * (e.g. from the panel calculator) are still recognised as UK products.
 */
export function isUKItem(item: { product: { id: string; currency?: string } }): boolean {
  if ((item.product.currency || "").toUpperCase() === "GBP") return true
  if (UK_EXTRA_IDS.has(item.product.id)) return true
  return (products.find((p) => p.id === item.product.id)?.currency || "").toUpperCase() === "GBP"
}
