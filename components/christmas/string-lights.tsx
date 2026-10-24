export function StringLights() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 -bottom-2 h-3 w-full"
      preserveAspectRatio="none"
      height="12"
    >
      <defs>
        <pattern id="string-lights" width="96" height="12" patternUnits="userSpaceOnUse">
          <path d="M0 2 Q24 10 48 2 T96 2" fill="none" stroke="var(--color-festive)" strokeOpacity="0.55" strokeWidth="1" />
          <circle cx="24" cy="6.5" r="1.8" fill="var(--color-accent)" />
          <circle cx="72" cy="6.5" r="1.8" fill="var(--color-chart-4)" />
        </pattern>
      </defs>
      <rect width="100%" height="12" fill="url(#string-lights)" />
    </svg>
  )
}
