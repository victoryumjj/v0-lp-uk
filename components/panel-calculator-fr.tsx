"use client"

import { useState } from "react"

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
  2: 24.90,
  6: 69,
  8: 89,
  10: 109,
  12: 249,
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
    price: BUNDLE_PRICES[bundle] ?? bundle * 34.9,
  }
}

interface PanelCalculatorFrProps {
  onSelectBundle?: (bundle: number) => void
}

export function PanelCalculatorFr({ onSelectBundle }: PanelCalculatorFrProps) {
  const [width, setWidth] = useState<string>("")
  const [height, setHeight] = useState<string>("")
  const [coverage, setCoverage] = useState<number>(100)
  const [result, setResult] = useState<CalcResult | null>(null)

  const handleCalculate = () => {
    const w = parseFloat(width)
    const h = parseFloat(height)
    if (!w || !h || w <= 0 || h <= 0) return
    setResult(calculate(w, h, coverage))
  }

  const handleSelectBundle = () => {
    if (result && onSelectBundle) {
      onSelectBundle(result.bundleRecommended)
    }
    // Scroll to bundle selector
    const bundleSelector = document.querySelector("[data-add-to-cart]")
    if (bundleSelector) {
      bundleSelector.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }

  return (
    <section className="bg-card border border-[#E8DDD4] rounded-2xl p-6 sm:p-8 my-8">
      <div className="text-xs font-semibold tracking-widest uppercase text-primary mb-2">
        Calculateur de surface
      </div>
      <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
        Combien de panneaux pour votre mur?
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        Entrez les dimensions de votre mur. Nous calculons la quantité exacte, avec marge de sécurité.
      </p>

      {/* Inputs */}
      <div className="flex items-end gap-3 mb-5 flex-wrap">
        <div className="flex flex-col gap-1.5 flex-1 min-w-[120px]">
          <label className="text-xs font-medium text-muted-foreground">Largeur du mur</label>
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
          <label className="text-xs font-medium text-muted-foreground">Hauteur du mur</label>
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
          Pourcentage du mur à couvrir
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
              {pct === 100 ? "Mur entier" : `${pct}%`}
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
        Calculer ma quantité
      </button>

      {/* Result */}
      {result && (
        <div className="mt-6 p-5 bg-white border border-[#E8DDD4] rounded-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Main result */}
          <div className="text-center pb-4 border-b border-[#F0EAE0] mb-4">
            <div className="text-5xl font-bold text-primary leading-none">{result.withBuffer}</div>
            <div className="text-sm font-medium text-foreground mt-1">panneaux recommandés</div>
            <div className="text-xs text-muted-foreground mt-1">
              ({result.panels} pour la surface + {result.withBuffer - result.panels} de réserve pour les découpes)
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="flex flex-col items-center p-2.5 bg-card rounded-lg">
              <span className="text-base font-bold text-foreground">{result.m2} m²</span>
              <span className="text-[10px] text-muted-foreground text-center">surface couverte</span>
            </div>
            <div className="flex flex-col items-center p-2.5 bg-card rounded-lg">
              <span className="text-base font-bold text-foreground">Pack {result.bundleRecommended}</span>
              <span className="text-[10px] text-muted-foreground text-center">pack recommandé</span>
            </div>
            <div className="flex flex-col items-center p-2.5 bg-[#FFF1EB] rounded-lg">
              <span className="text-base font-bold text-primary">{result.price} EUR</span>
              <span className="text-[10px] text-muted-foreground text-center">prix total</span>
            </div>
          </div>

          {/* CTA */}
          <button
            type="button"
            onClick={handleSelectBundle}
            className="w-full py-3.5 bg-primary text-white rounded-full text-base font-medium hover:bg-primary/90 active:scale-[0.98] transition-all mb-3 rounded-full"
          >
            Sélectionner le Pack {result.bundleRecommended} {result.price} EUR
          </button>

          <p className="text-[11px] text-muted-foreground text-center">
            +10% de marge incluse pour les chutes de découpe. Retours gratuits si vous en commandez trop.
          </p>
        </div>
      )}
    </section>
  )
}
