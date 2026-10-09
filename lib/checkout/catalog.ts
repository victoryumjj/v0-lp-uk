import "server-only"

import { products } from "@/lib/products"

/**
 * Server-side source of truth for checkout prices (Stripe checkout).
 *
 * IMPORTANT: this file does NOT define new prices. It mirrors the prices that
 * already exist on the site so the server can REJECT any amount that the
 * browser tampers with:
 *   - every product in lib/products.ts, at its listed price
 *   - UK checkout upsells   (components/upsell-products-uk.tsx)
 *   - FR pack / custom-qty  (components/add-to-cart-button.tsx)
 *   - generic cart /cart    (charged in EUR, success page /succes-fr — same as before)
 * If you change a price in one of those files, update it here too.
 */

export type Market = "UK" | "FR"

export const MARKETS: Record<
  Market,
  { currency: "GBP" | "EUR"; shippingCountries: string[]; successPath: string; locale: string }
> = {
  UK: {
    currency: "GBP",
    shippingCountries: ["GB"], // United Kingdom only
    successPath: "/success-uk",
    locale: "en-GB",
  },
  FR: {
    currency: "EUR",
    shippingCountries: ["FR", "BE", "CH", "LU", "MC", "DE", "NL", "ES", "IT", "PT", "AT", "IE"],
    successPath: "/succes-fr",
    locale: "fr-FR",
  },
}

export function isMarket(value: unknown): value is Market {
  return value === "UK" || value === "FR"
}

const toCents = (n: number) => Math.round(n * 100)
export const centsToValue = (c: number) => (c / 100).toFixed(2)

interface CatalogEntry {
  name: string
  unitCents: Set<number>
  /** Product image (absolute https URL or site-relative path) */
  image?: string
}

/** Prefer formats every checkout renders (jpg/png/webp) over avif/others. */
function pickImage(images: Array<string | undefined>): string | undefined {
  const list = images.filter((u): u is string => typeof u === "string" && u.length > 0)
  return list.find((u) => /\.(jpe?g|png|webp)(\?|$)/i.test(u)) ?? list[0]
}

/** Turns a site-relative image path into an absolute URL (external services can't open "/img.jpg"). */
export function absoluteImageUrl(image: string | undefined, origin: string): string | undefined {
  if (!image) return undefined
  try {
    const url = new URL(image, origin)
    return url.protocol === "https:" ? url.toString() : undefined
  } catch {
    return undefined
  }
}

// Upsells shown on /checkout-uk (same ids/prices as components/upsell-products-uk.tsx)
const UK_EXTRA_ITEMS: Record<string, { name: string; price: number; image: string }> = {
  "led-kit-uk": {
    name: "Recessed LED Strip Kit",
    price: 109.0,
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/LED0101-NcQN4b3GARfX7EQhQSIcnMbQB9NsFa.jpg",
  },
  "glue-kit-uk": {
    name: "Pro Fixing Adhesive",
    price: 12.9,
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/CLEAN04-jsHtrQ87vwg45Qyo5RrSkzrJbV2MXC.jpg",
  },
}

// FR flexible panel: extra unit prices produced by the existing FR offers
// (components/add-to-cart-button.tsx): custom quantity x 14.49 and Pack 12 = 249.00
const FR_PANEL_ID = "prod_U2rumuoWXebtgj"
const FR_PANEL_EXTRA_UNIT_PRICES = [14.49, 249.0 / 12]

// EN flexible panel packs (components/add-to-cart-button.tsx → enQuantities), sold via /cart
const EN_PANEL_ID = "prod_U4kuSjp9pwoOzo"
const EN_PANEL_PACK_UNIT_PRICES = [17.9, 32.0 / 2, 60.0 / 4, 85.0 / 6]

function buildCatalog(market: Market): Map<string, CatalogEntry> {
  const currency = MARKETS[market].currency
  const map = new Map<string, CatalogEntry>()

  for (const p of products) {
    if ((p.currency || "").toUpperCase() !== currency) continue
    map.set(p.id, { name: p.name, unitCents: new Set([toCents(p.price)]), image: pickImage(p.images ?? []) })
  }

  if (market === "UK") {
    for (const [id, item] of Object.entries(UK_EXTRA_ITEMS)) {
      map.set(id, { name: item.name, unitCents: new Set([toCents(item.price)]), image: item.image })
    }
  }

  if (market === "FR") {
    const entry = map.get(FR_PANEL_ID)
    if (entry) for (const price of FR_PANEL_EXTRA_UNIT_PRICES) entry.unitCents.add(toCents(price))

    // /cart (generic store) always charged in EUR at the listed number, whatever the
    // product's catalog currency. Kept identical to the previous checkout.
    // GBP (UK) products are never sold in EUR: they must use the UK checkout.
    for (const p of products) {
      if ((p.currency || "").toUpperCase() === "GBP") continue
      if (!map.has(p.id)) map.set(p.id, { name: p.name, unitCents: new Set([toCents(p.price)]), image: pickImage(p.images ?? []) })
    }
    const en = map.get(EN_PANEL_ID)
    if (en) for (const price of EN_PANEL_PACK_UNIT_PRICES) en.unitCents.add(toCents(price))
  }

  return map
}

const CATALOGS: Record<Market, Map<string, CatalogEntry>> = {
  UK: buildCatalog("UK"),
  FR: buildCatalog("FR"),
}

export interface RequestedItem {
  id: string
  quantity: number
  unitPrice: number
}

export interface ValidatedLine {
  id: string
  name: string
  quantity: number
  unitCents: number
  image?: string
}

export class CheckoutValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "CheckoutValidationError"
  }
}

const MAX_QTY = 100
const MAX_LINES = 20

/** Validates what the browser asked for against the server catalog. */
export function validateRequestedItems(market: Market, items: unknown): ValidatedLine[] {
  if (!Array.isArray(items) || items.length === 0) throw new CheckoutValidationError("Cart is empty")
  if (items.length > MAX_LINES) throw new CheckoutValidationError("Too many items")

  const catalog = CATALOGS[market]
  const lines: ValidatedLine[] = []

  for (const raw of items as RequestedItem[]) {
    const id = typeof raw?.id === "string" ? raw.id : ""
    const quantity = Number(raw?.quantity)
    const unitCents = toCents(Number(raw?.unitPrice))

    const entry = catalog.get(id)
    if (!entry) throw new CheckoutValidationError(`Unknown product: ${id}`)
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QTY) {
      throw new CheckoutValidationError(`Invalid quantity for ${entry.name}`)
    }
    if (!entry.unitCents.has(unitCents)) {
      throw new CheckoutValidationError(`Invalid price for ${entry.name}`)
    }

    lines.push({ id, name: entry.name, quantity, unitCents, image: entry.image })
  }

  return lines
}

export function totalCents(lines: ValidatedLine[]) {
  return lines.reduce((sum, l) => sum + l.unitCents * l.quantity, 0)
}

/** Display name of a catalog item (falls back to the id). */
export function productName(market: Market, id: string): string {
  return CATALOGS[market].get(id)?.name ?? id
}
