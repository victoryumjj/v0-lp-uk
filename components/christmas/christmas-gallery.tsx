"use client"

import { useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

export function ChristmasGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0)

  if (images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-md bg-tile-sage text-xs text-muted-foreground">
        Photo coming soon
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square overflow-hidden rounded-md bg-muted">
        <Image
          src={images[active] || "/placeholder.svg"}
          alt={`${name} — photo ${active + 1} of ${images.length}`}
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
      </div>
      {images.length > 1 && (
        <ul className="flex gap-2 overflow-x-auto" aria-label="Product photos">
          {images.map((src, i) => (
            <li key={src} className="shrink-0">
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show photo ${i + 1}`}
                aria-current={i === active}
                className={cn(
                  "relative block size-16 overflow-hidden rounded-md border-2 transition-colors sm:size-20",
                  i === active ? "border-foreground" : "border-transparent opacity-70 hover:opacity-100",
                )}
              >
                <Image src={src || "/placeholder.svg"} alt="" fill sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
