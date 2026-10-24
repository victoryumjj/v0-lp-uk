export type ChristmasCategoryId = "trees" | "baubles-bows" | "garlands-wreaths" | "lights-home"

export interface ChristmasCategory {
  id: ChristmasCategoryId
  name: string
  tile: "sage" | "blush" | "sand"
}

export interface ChristmasProduct {
  slug: string
  name: string
  category: ChristmasCategoryId
  /** GBP. `null` until the final price is set. */
  price: number | null
  /** Empty until supplier photos are added. */
  images: string[]
  description?: string
}

export const christmasCategories: ChristmasCategory[] = [
  { id: "trees", name: "Trees", tile: "sage" },
  { id: "baubles-bows", name: "Baubles & Bows", tile: "blush" },
  { id: "garlands-wreaths", name: "Garlands & Wreaths", tile: "sage" },
  { id: "lights-home", name: "Lights & Home", tile: "sand" },
]

const item = (name: string, category: ChristmasCategoryId): ChristmasProduct => ({
  slug: name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, ""),
  name,
  category,
  price: null,
  images: [],
})

export const christmasProducts: ChristmasProduct[] = [
  item("2ft Rattan Tree", "trees"),
  item("8ft Pre Lit Grand Fir Christmas Tree", "trees"),
  item("Light Up Bristle Treescape Decoration", "trees"),
  item("Scallop Rattan Tree Skirt", "trees"),
  item("Textured Tinsel Tree Skirt", "trees"),

  item("10 Pack Flocked Oversized Shatterproof Baubles", "baubles-bows"),
  item("50 Pack Glass Baubles", "baubles-bows"),
  item("6 Pack Satin Stripe Baubles", "baubles-bows"),
  item("80 Pack Mix Shatterproof Baubles", "baubles-bows"),
  item("9 Pack Flocked Ridged Baubles", "baubles-bows"),
  item("3 Pack Velvet Bows", "baubles-bows"),
  item("Velvet Bow Decoration", "baubles-bows"),

  item("6ft Light Up Green Garland", "garlands-wreaths"),
  item("Pre Lit Red Berry Garland", "garlands-wreaths"),
  item("Velvet Bell and Bow Garland", "garlands-wreaths"),
  item("Autumn Bow Garland", "garlands-wreaths"),
  item("Plain Bow Wreath", "garlands-wreaths"),
  item("Real Winter Berry Wreath", "garlands-wreaths"),
  item("Red Berry Wreath", "garlands-wreaths"),
  item("Set of 3 Mini Bow Wreaths", "garlands-wreaths"),

  item("300 Bright White LED Mains Lights", "lights-home"),
  item("6 Pack Light Up Clip-On Decorations", "lights-home"),
  item("Scalloped Rattan Extra Large Pendant Light", "lights-home"),
  item("Rattan Scallop Tray", "lights-home"),
  item("Pure Cotton Astley Flannel Bedding Set", "lights-home"),
]

export const featuredChristmasSlugs = [
  "8ft-pre-lit-grand-fir-christmas-tree",
  "10-pack-flocked-oversized-shatterproof-baubles",
  "6ft-light-up-green-garland",
  "300-bright-white-led-mains-lights",
]

export function getChristmasCategory(id: ChristmasCategoryId) {
  return christmasCategories.find((c) => c.id === id)!
}

export function getFeaturedChristmasProducts() {
  return featuredChristmasSlugs
    .map((slug) => christmasProducts.find((p) => p.slug === slug))
    .filter((p): p is ChristmasProduct => Boolean(p))
}

export function isChristmasCategory(value: string | undefined): value is ChristmasCategoryId {
  return christmasCategories.some((c) => c.id === value)
}
