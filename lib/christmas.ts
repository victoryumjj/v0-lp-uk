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
  details?: string[]
  options?: { label: string; values: string[] }
}

export const christmasCategories: ChristmasCategory[] = [
  { id: "trees", name: "Trees", tile: "sage" },
  { id: "baubles-bows", name: "Baubles & Bows", tile: "blush" },
  { id: "garlands-wreaths", name: "Garlands & Wreaths", tile: "sage" },
  { id: "lights-home", name: "Lights & Home", tile: "sand" },
]

const item = (
  name: string,
  category: ChristmasCategoryId,
  extra: Partial<Omit<ChristmasProduct, "slug" | "name" | "category">> = {},
): ChristmasProduct => ({
  slug: name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, ""),
  name,
  category,
  price: null,
  images: [],
  ...extra,
})

const photos = (base: string, count: number) =>
  Array.from({ length: count }, (_, i) => `/images/christmas/${base}-${i + 1}.avif`)

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
  item("Velvet Bow Decoration", "baubles-bows", {
    images: photos("velvet-bow-decoration", 5),
    description:
      "This plush velvet bow brings a stylish touch to your living space. Display this chic decoration on your Christmas tree, mantelpiece or front door using the handy hanging loop.",
    details: ["Plush velvet finish", "Colour: Rust", "Integrated hanging loop", "Ideal for trees, mantels, mirrors and doors"],
  }),

  item("6ft Light Up Green Garland", "garlands-wreaths"),
  item("Pre Lit Red Berry Garland", "garlands-wreaths"),
  item("Velvet Bell and Bow Garland", "garlands-wreaths"),
  item("Autumn Bow Garland", "garlands-wreaths"),
  item("Plain Bow Wreath", "garlands-wreaths"),
  item("Real Winter Berry Wreath", "garlands-wreaths"),
  item("Red Berry Wreath", "garlands-wreaths"),
  item("Set of 3 Mini Bow Wreaths", "garlands-wreaths"),

  item("300 Bright White LED Mains Lights", "lights-home", {
    images: photos("300-bright-white-led-mains-lights", 4),
    description:
      "A string of 300 bright white LED lights that adds a festive glow to your seasonal decorations. Mains powered for convenience, with a remote control to adjust intensity, set timers and choose from eight flash patterns. The long design is ideal for wrapping around a tree, and it is suitable for indoor and outdoor use.",
    details: [
      "300 bright white LEDs",
      "Mains powered — no batteries needed",
      "Remote control with dimmer and timer",
      "8 flash patterns",
      "Indoor and outdoor use",
    ],
  }),
  item("6 Pack Light Up Clip-On Decorations", "lights-home"),
  item("Scalloped Rattan Extra Large Pendant Light", "lights-home"),
  item("Rattan Scallop Tray", "lights-home"),
  item("Pure Cotton Astley Floral Christmas Bedding Set", "lights-home", {
    images: photos("astley-floral-bedding-set", 5),
    description:
      "Celebrate the season in classic style with the Astley Floral Christmas bedding set. Made from pure cotton with a softly brushed finish that brings extra warmth and comfort to cosy winter nights. The reversible design offers two festive looks in one: a charming floral and foliage print on one side and a traditional tartan check on the reverse.",
    details: ["100% pure cotton", "Softly brushed finish", "Reversible: floral print / tartan check", "Colour: Festive Red"],
    options: {
      label: "Size",
      values: ["Single (3 ft)", "Double (4 ft 6)", "King Size (5 ft)", "Super King Size (6 ft)"],
    },
  }),
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

export function getChristmasProduct(slug: string) {
  return christmasProducts.find((p) => p.slug === slug)
}

export function isChristmasCategory(value: string | undefined): value is ChristmasCategoryId {
  return christmasCategories.some((c) => c.id === value)
}
