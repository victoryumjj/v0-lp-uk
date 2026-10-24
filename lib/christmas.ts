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
  /** Upper bound when the supplier only lists a price range. */
  priceMax?: number
  /** Empty until supplier photos are added. */
  images: string[]
  description?: string
  details?: string[]
  /** Optional per-value prices (same order as `values`). Overrides `price` when selected. */
  options?: { label: string; values: string[]; prices?: number[] }
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
  item("2ft Rattan Tree", "trees", {
    price: 30,
    images: photos("2ft-rattan-tree", 4),
    description:
      "A natural rattan tree with tiered scalloped edges that brings warm, handcrafted texture to festive styling. Standing 2ft tall, it makes a charming accent on a sideboard, mantelpiece or console — pair it with the Rattan Scallop Tray to complete the look.",
    details: ["Height: 2ft", "Hand-woven natural rattan", "Tiered scalloped design", "Colour: Natural"],
  }),
  item("8ft Pre Lit Grand Fir Christmas Tree", "trees", {
    price: 350,
    images: photos("8ft-pre-lit-grand-fir-tree", 4),
    description:
      "Standing at an impressive 8ft tall, this Grand Fir Christmas tree brings instant festive impact to your home. It's pre-lit with 2,000 LED lights, expertly arranged on memory wire for effortless styling year after year. The lights can be set to either warm white or multi-coloured, with eight light settings, plus a foot pedal and remote control for easy operation. A quick-connect power pole and sturdy metal stand ensure fast, hassle-free assembly.",
    details: [
      "Height: 8ft",
      "Pre-lit with 2,000 LED lights on memory wire",
      "Warm white or multi-coloured settings",
      "8 light functions with foot pedal and remote control",
      "Quick-connect power pole and metal stand",
      "Mains powered",
      "Colour: Green",
    ],
  }),
  item("Light Up Bristle Treescape Decoration", "trees"),
  item("Scallop Rattan Tree Skirt", "trees", {
    price: 35,
    images: photos("scallop-rattan-tree-skirt", 4),
    description:
      "A scallop edge gives this rattan tree skirt a decorative finish beneath the Christmas tree. Standing 12 inches high, the natural rattan weave brings warmth and texture to festive styling, while the scalloped trim adds more detail than a plain edge. It sits neatly around the base of the tree, concealing the stand and any cables.",
    details: ["Height: 12 inches", "Natural rattan weave", "Scalloped trim", "Comes in three parts for easy storage", "Colour: Brown"],
    options: { label: "Size", values: ["24 Inches", "28 Inches"], prices: [35, 40] },
  }),
  item("Textured Tinsel Tree Skirt", "trees"),

  item("10 Pack Flocked Oversized Shatterproof Baubles", "baubles-bows", {
    price: 10,
    images: photos("10-pack-flocked-oversized-baubles", 3),
    description:
      "Introduce luxurious textures to your tree decor with this 10-pack of velvety flocked and smooth matte baubles. The oversized design makes them ideal for when you want to add real impact to your tree, along a garland or to bring wow-factor to your wreath. Made with a shatterproof construction for safety.",
    details: ["Pack of 10 oversized baubles", "Mix of velvety flocked and smooth matte finishes", "Shatterproof construction", "Colour: Red"],
  }),
  item("50 Pack Glass Baubles", "baubles-bows"),
  item("6 Pack Satin Stripe Baubles", "baubles-bows"),
  item("80 Pack Mix Shatterproof Baubles", "baubles-bows", {
    price: 20,
    images: photos("80-pack-mix-shatterproof-baubles", 3),
    description:
      "Decorate your tree in one simple and coordinated go with this 80-pack of baubles. It includes a mix of ribbed, glittery and polished round styles, alongside smaller faceted designs in matching finishes. A plastic construction ensures they're shatterproof for added durability. Re-use the box to keep them safely stored away at the end of the season.",
    details: [
      "Pack of 80 coordinated baubles",
      "Ribbed, glitter, polished and faceted styles",
      "Shatterproof plastic construction",
      "Reusable storage box",
      "Colour: Brown Mix",
    ],
  }),
  item("9 Pack Flocked Ridged Baubles", "baubles-bows", {
    price: 12,
    images: photos("9-pack-flocked-ridged-baubles", 3),
    description:
      "With their flocked surfaces embellished with glittery ridged detailing, these baubles are an opulent choice. They come in a selection of red and green colourways for a traditional feel. Hanging strings add the finishing touch.",
    details: ["Pack of 9 baubles", "Flocked finish with glitter ridged detailing", "Brushed brass-look caps", "Hanging strings included", "Colour: Red Mix"],
  }),
  item("3 Pack Velvet Bows", "baubles-bows"),
  item("Velvet Bow Decoration", "baubles-bows", {
    price: 18,
    images: photos("velvet-bow-decoration", 5),
    description:
      "This plush velvet bow brings a stylish touch to your living space. Display this chic decoration on your Christmas tree, mantelpiece or front door using the handy hanging loop.",
    details: ["Plush velvet finish", "Colour: Rust", "Integrated hanging loop", "Ideal for trees, mantels, mirrors and doors"],
  }),

  item("6ft Light Up Green Garland", "garlands-wreaths"),
  item("Pre Lit Red Berry Garland", "garlands-wreaths"),
  item("Velvet Bell and Bow Garland", "garlands-wreaths", {
    price: 12,
    images: photos("velvet-bell-and-bow-garland", 2),
    description:
      "This velvet garland is decorated with bells and bows for a festive finishing touch. It's a simple way to dress a bannister, mantelpiece or doorway for the season.",
    details: ["Soft velvet finish", "Decorated with bells and bows", "Ideal for bannisters, mantels and doorways", "Colour: Red Mix"],
  }),
  item("Autumn Bow Garland", "garlands-wreaths"),
  item("Plain Bow Wreath", "garlands-wreaths"),
  item("Real Winter Berry Wreath", "garlands-wreaths"),
  item("Red Berry Wreath", "garlands-wreaths"),
  item("Set of 3 Mini Bow Wreaths", "garlands-wreaths"),

  item("300 Bright White LED Mains Lights", "lights-home", {
    price: 14,
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
  item("Rattan Scallop Tray", "lights-home", { price: 15 }),
  item("Pure Cotton Astley Floral Christmas Bedding Set", "lights-home", {
    price: 45,
    priceMax: 85,
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

export function formatGBP(value: number) {
  return `£${Number.isInteger(value) ? value : value.toFixed(2)}`
}

/** "£35 – £40" for products with per-option prices, otherwise "£35". */
export function formatPriceRange(product: ChristmasProduct) {
  const prices = product.options?.prices
  if (prices?.length) {
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    return min === max ? formatGBP(min) : `${formatGBP(min)} – ${formatGBP(max)}`
  }
  if (product.price === null) return null
  if (product.priceMax && product.priceMax > product.price)
    return `${formatGBP(product.price)} – ${formatGBP(product.priceMax)}`
  return formatGBP(product.price)
}
