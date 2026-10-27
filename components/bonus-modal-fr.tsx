"use client"

import { useState, useEffect } from "react"
import { X, Gift, Clock, Check } from "lucide-react"

interface BonusModalFrProps {
  isOpen: boolean
  onClose: () => void
  onAcceptBonus: () => void
  onDeclineBonus: () => void
}

export function BonusModalFr({ isOpen, onClose, onAcceptBonus, onDeclineBonus }: BonusModalFrProps) {
  const [timeLeft, setTimeLeft] = useState(15 * 60) // 15 minutes in seconds
  const [bonusActivated, setBonusActivated] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isOpen])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleActivateBonus = () => {
    setBonusActivated(true)
    // Wait a moment to show confirmation, then proceed
    setTimeout(() => {
      onAcceptBonus()
    }, 1500)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-[#fff8e8] border-2 border-[#e8a020] rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Header with timer */}
        <div className="bg-[#e8a020] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-white" />
            <span className="text-white font-medium text-sm tracking-wide">OFFRE EXPIRE DANS</span>
          </div>
          <span className="bg-[#7a4200] text-white font-semibold text-sm px-3 py-1 rounded-md min-w-[60px] text-center">
            {formatTime(timeLeft)}
          </span>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-white/80 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Body */}
        <div className="p-5">
          {/* Congratulations message */}
          <div className="flex items-start gap-3 mb-4">
            <Gift className="w-6 h-6 text-[#e8a020] flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-[#7a4200] leading-relaxed">
              Félicitations, vous avez reçu un cadeau pour votre première commande !
            </p>
          </div>

          <p className="text-sm font-semibold text-[#3a2800] mb-4">
            FINALISEZ MAINTENANT ET RECEVEZ GRATUITEMENT :
          </p>

          {/* Bonus items */}
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm text-[#3a2800]">5 Panneaux Acoustiques Bonus</span>
              </div>
              <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded">GRATUIT</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm text-[#3a2800]">Nettoyant Clean</span>
              </div>
              <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded">GRATUIT</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm text-[#3a2800]">Technicien pour l&apos;installation</span>
              </div>
              <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded">GRATUIT</span>
            </div>
          </div>

          {/* Value note */}
          <div className="border-l-4 border-[#e8a020] bg-[#fff3d0] px-3 py-2 rounded-r-lg mb-5">
            <p className="text-xs text-[#7a4200]">
              Valeur des cadeaux : <strong>€127,00</strong> — Inclus uniquement dans cette commande
            </p>
          </div>

          {/* Bonus activated confirmation */}
          {bonusActivated && (
            <div className="bg-green-50 border-2 border-green-600 rounded-xl p-4 mb-4 animate-in fade-in duration-300">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm font-medium text-green-800">Bonus ajouté à votre commande !</span>
              </div>
              <div className="space-y-1 text-xs text-green-700 mb-3">
                <p>+ 5 Panneaux Acoustiques Bonus</p>
                <p>+ Nettoyant Clean</p>
                <p>+ Technicien pour l&apos;installation</p>
              </div>
              <div className="border-t border-green-200 pt-2 flex items-center justify-between">
                <span className="text-xs text-green-700">Code d&apos;installation</span>
                <span className="text-sm font-semibold text-green-800 bg-white border border-green-200 rounded px-2 py-0.5 tracking-wider">
                  AXB8930M9
                </span>
              </div>
              {/* Installation code warning */}
              <div className="mt-3 pt-3 border-t border-green-200">
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5 leading-relaxed">
                  <strong>Attention :</strong> Passez le code d&apos;installation à la livraison si vous désirez que notre équipe fasse l&apos;installation des panneaux. L&apos;installation n&apos;est valide qu&apos;avec le code, notez-le !
                </p>
              </div>
            </div>
          )}

          {/* Accept button */}
          {!bonusActivated && (
            <button
              onClick={handleActivateBonus}
              className="w-full bg-[#e8a020] hover:bg-[#d49318] text-white font-medium py-3.5 rounded-full flex items-center justify-center gap-2 transition-all active:scale-[0.98] mb-3"
            >
              <Gift className="w-5 h-5" />
              Je veux profiter du bonus !
            </button>
          )}

          {/* Decline link */}
          {!bonusActivated && (
            <button
              onClick={onDeclineBonus}
              className="w-full text-center text-xs text-[#7a4200]/60 hover:text-[#7a4200] underline transition-colors"
            >
              Non merci, continuer sans bonus
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
