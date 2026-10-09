"use client"

import { useEffect, useState } from "react"

/**
 * Christmas decoration for the header (star next to the logo + hanging garland).
 * Decoration only: no text, no offers. It switches itself off automatically
 * on CHRISTMAS_END — no redeploy needed to remove it.
 */
const CHRISTMAS_END = new Date("2027-01-06T00:00:00Z") // Twelfth Night

function useChristmasSeason() {
  // Decided on the client after mount, so a page built before the end date
  // never keeps showing the decoration once the season is over.
  const [active, setActive] = useState(false)
  useEffect(() => {
    setActive(Date.now() < CHRISTMAS_END.getTime())
  }, [])
  return active
}

export function ChristmasStar() {
  const active = useChristmasSeason()
  if (!active) return null
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#B8901F"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mr-2 h-4 w-4 shrink-0 lg:h-5 lg:w-5"
    >
      <path d="M12 2l2.6 6.4L21 9l-5 4.3L17.5 20 12 16.4 6.5 20 8 13.3 3 9l6.4-.6z" />
    </svg>
  )
}

export function ChristmasGarland() {
  const active = useChristmasSeason()
  if (!active) return null
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-full h-[14px] overflow-hidden">
      <svg width="100%" height="14">
        <defs>
          <pattern id="slatura-garland" width="320" height="14" patternUnits="userSpaceOnUse">
            <path d="M0 1 Q 80 13 160 1 Q 240 13 320 1" fill="none" stroke="#1F4D3A" strokeWidth="2" />
            <circle cx="80" cy="10" r="3.5" fill="#B3261E" />
            <circle cx="240" cy="10" r="3.5" fill="#D4A72C" />
          </pattern>
        </defs>
        <rect width="100%" height="14" fill="url(#slatura-garland)" />
      </svg>
    </div>
  )
}
