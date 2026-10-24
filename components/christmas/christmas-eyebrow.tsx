import { Star } from "lucide-react"

export function ChristmasEyebrow() {
  return (
    <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-festive">
      <Star className="h-3 w-3 fill-chart-4 text-chart-4" aria-hidden="true" />
      {"New · Christmas 2026"}
    </span>
  )
}
