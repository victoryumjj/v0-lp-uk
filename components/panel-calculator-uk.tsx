"use client"

import { useState } from "react"
import { useCart } from "@/lib/cart-context"
import { useToast } from "@/hooks/use-toast"

interface CalcResult {
  panels: number
  withBuffer: number
  m2: number
  bundleRecommended: number
  price: number
}

const PANEL_AREA = 2.97 // 270cm x 110cm = 2.97 m²
const BUNDLES = [2, 6, 8, 10, 12]
const BUNDLE_PRICES: Record<number, number> = {
  2: 21.90,
  6: 59,
  8: 79,
  10: 99,
  12: 219,
}

function getRecommendedBundle(panels: number): number {
  return BUNDLES.find((b) => b >= panels) ?? 12
}

function calculate(width: number, height: number, coverage: number): CalcResult {
  const wallArea = width * height
  const targetArea = wallArea * (coverage / 100)
  const rawPanels = Math.ceil(targetArea / PANEL_AREA)
  const withBuffer = Math.ceil(rawPanels * 1.1)
  const bundle = getRecommendedBundle(withBuffer)
  return {
    panels: rawPanels,
    withBuffer,
    m2: parseFloat(targetArea.toFixed(1)),
    bundleRecommended: bundle,
    price: BUNDLE_PRICES[bundle] ?? bundle * 29.9,
  }
}

interface PanelCalculatorUKProps {
  product: any
  onAddedToCart?: (orderData: { qty: number; price: number; totalPrice: number; ledFree: boolean }) => void
  onSelectBundle?: (bundle: number) => void
}

export function PanelCalculatorUK({ product, onAddedToCart, onSelectBundle }: PanelCalculatorUKProps) {
  const [width, setWidth] = useState<string>("")
  const [height, setHeight] = useState<string>("")
  const [coverage, setCoverage] = useState<number>(100)
  const [result, setResult] = useState<CalcResult | null>(null)
  const { addItem } = useCart()
  const { toast } = useToast()

  const handleCalculate = () => {
    const w = parseFloat(width)
    const h = parseFloat(height)
    if (!w || !h || w <= 0 || h <= 0) return
    setResult(calculate(w, h, coverage))
  }

  const handleSelectBundle = () => {
    if (result) {
      // Add to cart
      addItem({
        id: product.id,
        name: product.name,
        price: result.price,
        image: product.images[0],
        quantity: result.bundleRecommended,
      })
      
      if (onAddedToCart) {
        onAddedToCart({
          qty: result.bundleRecommended,
          price: result.price / result.bundleRecommended,
          totalPrice: result.price,
          ledFree: result.bundleRecommended >= 10,
        })
      }
      
      if (onSelectBundle) {
        onSelectBundle(result.bundleRecommended)
      }
      
      toast({
        title: "Added to cart!",
        description: `${result.bundleRecommended} panels added to your cart`,
      })
    }
  }

  return (
    <section className="bg-card border border-[#E8DDD4] rounded-2xl p-6 sm:p-8 my-8" data-add-to-cart>
      <div className="text-xs font-semibold tracking-widest uppercase text-primary mb-2">
        Surface Calculator
      </div>
      <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
        How many panels for your wall?
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        Enter your wall dimensions. We calculate the exact quantity, with a safety margin included.
      </p>

      {/* Inputs */}
      <div className="flex items-end gap-3 mb-5 flex-wrap">
        <div className="flex flex-col gap-1.5 flex-1 min-w-[120px]">
          <label className="text-xs font-medium text-muted-foreground">Wall Width</label>
          <div className="relative">
            <input
              type="number"
              placeholder="3.5"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              min="0.5"
              step="0.1"
              className="w-full px-3 py-2.5 pr-10 border border-[#E8DDD4] rounded-lg text-base bg-white text-foreground focus:outline-none focus:border-primary transition-colors"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium pointer-events-none">
              m
            </span>
          </div>
        </div>
        <span className="text-2xl text-[#C8C0B8] pb-2">x</span>
        <div className="flex flex-col gap-1.5 flex-1 min-w-[120px]">
          <label className="text-xs font-medium text-muted-foreground">Wall Height</label>
          <div className="relative">
            <input
              type="number"
              placeholder="2.5"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              min="0.5"
              step="0.1"
              className="w-full px-3 py-2.5 pr-10 border border-[#E8DDD4] rounded-lg text-base bg-white text-foreground focus:outline-none focus:border-primary transition-colors"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium pointer-events-none">
              m
            </span>
          </div>
        </div>
      </div>

      {/* Coverage */}
      <div className="mb-6">
        <label className="block text-xs font-medium text-muted-foreground mb-2">
          Percentage of wall to cover
        </label>
        <div className="flex gap-2 flex-wrap">
          {[25, 50, 75, 100].map((pct) => (
            <button
              key={pct}
              type="button"
              onClick={() => setCoverage(pct)}
              className={`px-4 py-2 border rounded-full text-sm transition-all ${
                coverage === pct
                  ? "border-primary bg-primary text-white"
                  : "border-[#E8DDD4] bg-white text-muted-foreground hover:border-primary hover:bg-primary hover:text-white"
              }`}
            >
              {pct === 100 ? "Full wall" : `${pct}%`}
            </button>
          ))}
        </div>
      </div>

      {/* Calculate button */}
      <button
        type="button"
        onClick={handleCalculate}
        className="w-full py-3.5 bg-foreground text-white rounded-full text-base font-medium hover:bg-foreground/90 active:scale-[0.98] transition-all"
      >
        Calculate my quantity
      </button>

      {/* Result */}
      {result && (
        <div className="mt-6 p-5 bg-white border border-[#E8DDD4] rounded-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Main result */}
          <div className="text-center pb-4 border-b border-[#F0EAE0] mb-4">
            <div className="text-5xl font-bold text-primary leading-none">{result.withBuffer}</div>
            <div className="text-sm font-medium text-foreground mt-1">panels recommended</div>
            <div className="text-xs text-muted-foreground mt-1">
              ({result.panels} for surface + {result.withBuffer - result.panels} spare for cuts)
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="flex flex-col items-center p-2.5 bg-card rounded-lg">
              <span className="text-base font-bold text-foreground">{result.m2} m²</span>
              <span className="text-[10px] text-muted-foreground text-center">surface covered</span>
            </div>
            <div className="flex flex-col items-center p-2.5 bg-card rounded-lg">
              <span className="text-base font-bold text-foreground">Pack {result.bundleRecommended}</span>
              <span className="text-[10px] text-muted-foreground text-center">recommended pack</span>
            </div>
            <div className="flex flex-col items-center p-2.5 bg-[#FFF1EB] rounded-lg">
              <span className="text-base font-bold text-primary">£{result.price}</span>
              <span className="text-[10px] text-muted-foreground text-center">total price</span>
            </div>
          </div>

          {/* CTA */}
          <button
            type="button"
            onClick={handleSelectBundle}
            className="w-full py-3.5 bg-primary text-white rounded-full text-base font-medium hover:bg-primary/90 active:scale-[0.98] transition-all mb-3 rounded-full"
          >
            Select Pack {result.bundleRecommended} - £{result.price}
          </button>

          <p className="text-[11px] text-muted-foreground text-center">
            +10% margin included for cutting waste. Free returns if you order too many.
          </p>
        </div>
      )}
    </section>
  )
}
