"use client"

import { Star } from "lucide-react"

const RATING_DISTRIBUTION = [
  { stars: 5, pct: 91 },
  { stars: 4, pct: 7 },
  { stars: 3, pct: 1 },
  { stars: 2, pct: 0.5 },
  { stars: 1, pct: 0.5 },
]

export function RatingBreakdownFr() {
  return (
    <div className="flex gap-6 items-center p-5 bg-card rounded-xl mb-6 flex-wrap">
      {/* Big score */}
      <div className="flex flex-col items-center">
        <span className="text-4xl sm:text-5xl font-bold text-foreground">4.9</span>
        <div className="flex gap-0.5 mt-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} className="w-4 h-4 fill-[#C8522A] text-primary" />
          ))}
        </div>
        <span className="text-xs text-muted-foreground mt-1">2 847 avis verifies</span>
      </div>

      {/* Bars */}
      <div className="flex-1 min-w-[200px] flex flex-col gap-1.5">
        {RATING_DISTRIBUTION.map(({ stars, pct }) => (
          <div key={stars} className="flex items-center gap-2 text-xs">
            <span className="w-5 text-muted-foreground">{stars}</span>
            <div className="flex-1 h-2 bg-[#E8DDD4] rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-1000"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-8 text-right text-muted-foreground">{pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
