"use client"

import { useEffect, useState } from "react"

export function StockUrgencyBarUK() {
  const [animatedWidth, setAnimatedWidth] = useState(0)

  useEffect(() => {
    // Animate the bar on mount
    const timer = setTimeout(() => setAnimatedWidth(68), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="my-3">
      <div className="h-1.5 bg-[#F0EAE0] rounded-full overflow-hidden mb-1.5">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${animatedWidth}%`,
            background: "linear-gradient(90deg, #C8522A, #E06B3A)",
          }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        <span className="text-primary font-medium">68% of stock sold</span>
        {" | "}Only <strong>52 panels</strong> remaining
      </p>
    </div>
  )
}
