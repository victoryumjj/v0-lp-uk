/**
 * Creates/updates every checkout catalog item as a Stripe Product (same id as the site)
 * with one Price per accepted unit amount and currency. Safe to run repeatedly.
 *
 * Run: npx tsx --conditions=react-server --env-file=/vercel/share/.env.project scripts/sync-stripe-products.ts
 */
import Stripe from "stripe"
import { absoluteImageUrl, listCatalog, MARKETS, type Market } from "../lib/checkout/catalog"
import { CHECKOUT_SOURCE } from "../lib/stripe/server"

const key = process.env.STRIPE_SECRET_KEY || process.env.atio_STRIPE_SECRET_KEY
if (!key) throw new Error("STRIPE_SECRET_KEY is not configured")
const stripe = new Stripe(key)
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.slaturadecori.com"

interface Merged {
  name: string
  image?: string
  prices: Map<string, { currency: string; cents: number }>
}

const merged = new Map<string, Merged>()
for (const market of Object.keys(MARKETS) as Market[]) {
  const currency = MARKETS[market].currency.toLowerCase()
  for (const item of listCatalog(market)) {
    const entry = merged.get(item.id) ?? { name: item.name, image: item.image, prices: new Map() }
    entry.image ??= item.image
    for (const cents of item.unitCents) entry.prices.set(`${currency}_${cents}`, { currency, cents })
    merged.set(item.id, entry)
  }
}

async function upsertProduct(id: string, item: Merged) {
  const image = absoluteImageUrl(item.image, SITE_URL)
  const data = {
    name: item.name,
    images: image ? [image] : [],
    metadata: { sku: id, source: CHECKOUT_SOURCE },
  }
  try {
    const existing = await stripe.products.retrieve(id)
    await stripe.products.update(id, { ...data, active: true })
    return existing.id
  } catch (err: any) {
    if (err?.code !== "resource_missing") throw err
    const created = await stripe.products.create({ id, ...data })
    return created.id
  }
}

async function main() {
  let productCount = 0
  let priceCount = 0

  for (const [id, item] of merged) {
    await upsertProduct(id, item)
    productCount++

    const lookupKeys = [...item.prices.keys()].map((k) => `${id}_${k}`)
    const existing = await stripe.prices.list({ lookup_keys: lookupKeys, limit: 100 })
    const have = new Set(existing.data.map((p) => p.lookup_key))

    for (const [k, { currency, cents }] of item.prices) {
      const lookupKey = `${id}_${k}`
      if (have.has(lookupKey)) continue
      await stripe.prices.create({
        product: id,
        currency,
        unit_amount: cents,
        lookup_key: lookupKey,
        metadata: { sku: id, source: CHECKOUT_SOURCE },
      })
      priceCount++
    }
    console.log(`OK ${id} — ${item.name} (${[...item.prices.keys()].join(", ")})`)
  }

  console.log(`\nDone: ${productCount} products synced, ${priceCount} new prices created.`)
}

main().catch((err) => {
  console.error("Sync failed:", err?.message ?? err)
  process.exit(1)
})
