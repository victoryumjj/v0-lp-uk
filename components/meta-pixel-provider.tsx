"use client"

declare global {
  interface Window {
    fbq?: (...args: any[]) => void
    _fbq?: any
  }
}

// Single Meta Pixel ID
const PIXEL_ID = "1200200552118123"

export function MetaPixelProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Noscript fallback for Meta Pixel */}
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>

      {children}
    </>
  )
}
