"use client"

import { useState } from "react"
import Image from "next/image"
import { Plus, Minus, Package } from "lucide-react"
import { useCart } from "@/lib/cart-context"

const SAMPLES = [
  {
    id: "tauari-preto",
    name: { en: "Tauari Black Felt", fr: "Tauari Feutre Noir" },
    image: "/images/samples/tauari-black-felt.jpg",
  },
  {
    id: "tauari-cinza",
    name: { en: "Tauari Grey Felt", fr: "Tauari Feutre Gris" },
    image: "/images/samples/tauari-grey-felt.jpg",
  },
  {
    id: "freijo",
    name: { en: "Freijó", fr: "Freijó" },
    image: "/images/samples/freijo.jpg",
  },
  {
    id: "blanchonella",
    name: { en: "Blanchonella", fr: "Blanchonella" },
    image: "/images/samples/blanchonella.jpg",
  },
  {
    id: "branco",
    name: { en: "White", fr: "Blanc" },
    image: "/images/samples/white.jpg",
  },
  {
    id: "preto",
    name: { en: "Black", fr: "Noir" },
    image: "/images/samples/black.jpg",
  },
]

const PRICE = { en: 5, fr: 5 }
const CURRENCY = { en: "£", fr: "€" }

const LABELS = {
  en: {
    title: "Colour Samples",
    subtitle:
      "Not sure which colour to choose? You can receive a physical sample before making your decision. Select the shades you want and get them with",
    freeShipping: "free shipping!",
    choose: "Choose your samples:",
    clickToAdd: "Click on the samples to add them.",
    selected: (n: number) => `${n} ${n === 1 ? "selected" : "selected"}`,
    total: "Total",
    shipping: "Delivery between",
    shippingDays: "6 to 15 business days",
    freeLabel: "Free Shipping",
    addToCart: "Add to Cart",
    remove: (name: string) => `Remove ${name}`,
    add: (name: string) => `Add ${name}`,
  },
  fr: {
    title: "Echantillons de couleurs",
    subtitle:
      "Vous hesitez sur la couleur ? Recevez un echantillon physique avant de prendre votre decision. Selectionnez les teintes souhaitees et recevez-les avec",
    freeShipping: "la livraison gratuite !",
    choose: "Choisissez vos echantillons :",
    clickToAdd: "Cliquez sur les echantillons pour les ajouter.",
    selected: (n: number) => `${n} ${n <= 1 ? "selectionne" : "selectionnes"}`,
    total: "Total",
    shipping: "Livraison estimée",
    shippingDays: "5 à 8 jours ouvrables",
    freeLabel: "Livraison gratuite",
    addToCart: "Ajouter au panier",
    remove: (name: string) => `Retirer ${name}`,
    add: (name: string) => `Ajouter ${name}`,
  },
}

interface SamplesSectionProps {
  isFrenchVersion?: boolean
}

export function SamplesSection({ isFrenchVersion = false }: SamplesSectionProps) {
  const [selected, setSelected] = useState<string[]>([])
  const { addItem } = useCart()
  const lang = isFrenchVersion ? "fr" : "en"
  const t = LABELS[lang]
  const price = PRICE[lang]
  const currency = CURRENCY[lang]
  const total = selected.length * price

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  const handleAddToCart = () => {
    selected.forEach((id) => {
      const sample = SAMPLES.find((s) => s.id === id)
      if (!sample) return
      const sampleProduct = {
        id: `sample-${id}`,
        slug: `sample-${id}`,
        name: `Sample - ${sample.name[lang]}`,
        description: sample.name[lang],
        longDescription: "",
        price: price,
        currency: isFrenchVersion ? "EUR" : "GBP",
        category: "samples",
        images: [sample.image],
        features: [],
        inStock: true,
        noShipping: true,
      }
      addItem(sampleProduct, 1)
    })
    setSelected([])
  }

  return (
    <div className="mt-8 border-t border-border pt-8">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-3">{t.title}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t.subtitle}{" "}
          <span className="font-semibold text-foreground">{t.freeShipping}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Left panel — preview */}
        <div className="rounded-xl border border-border bg-secondary/20 flex flex-col items-center justify-center p-8 min-h-[260px]">
          {selected.length === 0 ? (
            <div className="flex flex-col items-center gap-3 text-center">
              <Package className="h-12 w-12 text-muted-foreground/40" strokeWidth={1.2} />
              <p className="text-xs text-muted-foreground">{t.clickToAdd}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex flex-wrap justify-center gap-2 max-w-[220px]">
                {selected.map((id) => {
                  const sample = SAMPLES.find((s) => s.id === id)!
                  return (
                    <div
                      key={id}
                      className="w-14 h-14 rounded-lg overflow-hidden border-2 border-accent shadow-sm"
                    >
                      <Image
                        src={sample.image}
                        alt={sample.name[lang]}
                        width={56}
                        height={56}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    </div>
                  )
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t.selected(selected.length)}
              </p>
            </div>
          )}
        </div>

        {/* Right panel — list */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">{t.choose}</span>
            <span className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full font-medium">
              {t.selected(selected.length)}
            </span>
          </div>

          <div className="space-y-2 flex-1">
            {SAMPLES.map((sample) => {
              const isSelected = selected.includes(sample.id)
              const name = sample.name[lang]
              return (
                <div
                  key={sample.id}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  className={`flex items-center gap-3 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? "border-accent bg-accent/5"
                      : "border-border bg-background hover:border-muted-foreground/40"
                  }`}
                  onClick={() => toggle(sample.id)}
                  onKeyDown={(e) => e.key === "Enter" && toggle(sample.id)}
                >
                  <div className="w-16 h-12 flex-shrink-0 overflow-hidden rounded-l-lg">
                    <Image
                      src={sample.image}
                      alt={name}
                      width={64}
                      height={48}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="flex-1 min-w-0 py-2">
                    <p className="text-sm font-medium leading-tight">{name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      + {currency}{price}.00
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label={isSelected ? t.remove(name) : t.add(name)}
                    className={`mr-3 w-7 h-7 rounded-full flex items-center justify-center border flex-shrink-0 transition-colors ${
                      isSelected
                        ? "border-accent bg-accent text-accent-foreground"
                        : "border-border bg-background text-foreground hover:border-muted-foreground"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation()
                      toggle(sample.id)
                    }}
                  >
                    {isSelected ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div className="mt-4 border-t border-border pt-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground">{t.total}</span>
              <span className="font-medium">{currency}{total}.00</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
              <span>
                {t.shipping}{" "}
                <strong className="text-foreground">{t.shippingDays}</strong>
              </span>
              <span className="bg-foreground text-background text-[10px] font-semibold px-2 py-0.5 rounded">
                {t.freeLabel}
              </span>
            </div>
            <button
              type="button"
              disabled={selected.length === 0}
              onClick={handleAddToCart}
              className="w-full bg-accent text-accent-foreground py-3 rounded-full text-sm font-semibold hover:bg-accent/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {t.addToCart}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
