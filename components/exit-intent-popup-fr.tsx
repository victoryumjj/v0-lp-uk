"use client"

import { useEffect, useState } from "react"
import { X, ShoppingCart } from "lucide-react"

interface ExitIntentPopupFrProps {
  onConfirm: () => void
}

export function ExitIntentPopupFr({ onConfirm }: ExitIntentPopupFrProps) {
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Don't show again if already dismissed this session
    if (sessionStorage.getItem("exit_popup_dismissed")) return

    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768

    // --- Desktop: mouseleave toward top of browser ---
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !dismissed) {
        setShow(true)
        setDismissed(true)
      }
    }

    // --- Mobile: fast scroll-up trigger ---
    let lastScrollY = window.scrollY
    let hasScrolledDown = false
    const handleScroll = () => {
      const currentY = window.scrollY
      const delta = lastScrollY - currentY // positive = scrolling up
      if (currentY > 300) hasScrolledDown = true
      if (hasScrolledDown && delta > 60 && !dismissed) {
        setShow(true)
        setDismissed(true)
      }
      lastScrollY = currentY
    }

    const timer = setTimeout(() => {
      if (isMobile) {
        window.addEventListener("scroll", handleScroll, { passive: true })
      } else {
        document.addEventListener("mouseleave", handleMouseLeave)
      }
    }, 3000)

    return () => {
      clearTimeout(timer)
      document.removeEventListener("mouseleave", handleMouseLeave)
      window.removeEventListener("scroll", handleScroll)
    }
  }, [dismissed])

  const handleClose = () => {
    setShow(false)
    sessionStorage.setItem("exit_popup_dismissed", "1")
  }

  const handleConfirm = () => {
    setShow(false)
    sessionStorage.setItem("exit_popup_dismissed", "1")
    onConfirm()
  }

  // Popup desativado
  return null
  // eslint-disable-next-line no-unreachable
  if (!show) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Offre spéciale"
    >
      <div
        className="relative w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl"
        style={{ animation: "popIn 0.3s ease" }}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground hover:bg-secondary transition-colors"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="mb-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Attendez!</p>
          <h2 className="text-xl font-bold text-foreground leading-tight">
            Votre panneau acoustique<br />est encore disponible
          </h2>
        </div>

        {/* Offer */}
        <div className="flex items-center justify-center gap-3 my-4">
          <span className="text-lg line-through text-muted-foreground">€57,00</span>
          <span className="text-4xl font-bold text-red-600">€15,44</span>
          <span className="rounded bg-red-600 px-2 py-0.5 text-xs font-bold text-white">-73%</span>
        </div>

        {/* Urgency */}
        <p className="text-sm font-medium text-red-700 mb-5">
          Seulement <strong>3 pièces</strong> restantes en stock
        </p>

        {/* CTA */}
        <button
          onClick={handleConfirm}
          className="w-full flex items-center justify-center gap-2 rounded-full bg-primary hover:bg-primary/90 text-white font-bold text-base py-4 transition-colors rounded-full"
        >
          <ShoppingCart className="h-5 w-5 flex-shrink-0" />
          Je veux mon panneau
        </button>

        {/* Dismiss */}
        <button
          onClick={handleClose}
          className="mt-3 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
        >
          Non merci, je préfère payer plein tarif
        </button>
      </div>

      <style>{`
        @keyframes popIn {
          from { transform: scale(0.85); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
