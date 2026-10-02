"use client"

import { Gift, Check, Wrench } from "lucide-react"
import Image from "next/image"
import { PayPalCheckout, type PayPalCheckoutCopy, type PayPalCheckoutItem } from "@/components/paypal-checkout"

const CLEANER_IMAGE = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/CLEAN04-jsHtrQ87vwg45Qyo5RrSkzrJbV2MXC.jpg"
const PANEL_IMAGE = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/panneu01-COvuniuy0UAMH2wAwPKmS9Tlev4Qrt.avif"

interface BonusData {
  bonusPanels: number
  cleanerIncluded: boolean
  technicianIncluded: boolean
  installationCode: string
  bonusValue: number
}

const COPY: PayPalCheckoutCopy = {
  confirmButton: "Confirmer ma commande",
  loading: "Chargement...",
  securePayment: "Paiement 100% Securise SSL - Visa, Mastercard, American Express",
  errorTitle: "Une erreur est survenue",
  tryAgain: "Reessayer",
  genericError: "Le paiement n'a pas pu etre traite. Veuillez reessayer.",
  cancelled: "Paiement annule. Vous pouvez reessayer quand vous le souhaitez.",
  declined: "Votre moyen de paiement a ete refuse. Essayez une autre carte ou PayPal.",
  shippingNotSupported: "Desole, nous ne livrons pas a cette adresse.",
  shippingMissing: "Veuillez indiquer une adresse de livraison pour finaliser la commande.",
  processing: "Confirmation du paiement...",
  cardButtonLabel: "Payer par carte bancaire",
}

interface PayPalCheckoutFrProps {
  items: PayPalCheckoutItem[]
  onInitiateCheckout?: () => void
  bonusData?: BonusData | null
}

export function PayPalCheckoutFr({ items, onInitiateCheckout, bonusData }: PayPalCheckoutFrProps) {
  return (
    <PayPalCheckout market="FR" items={items} onInitiateCheckout={onInitiateCheckout} copy={COPY}>
      {/* Bonus items reminder before payment */}
      {bonusData && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 mb-2">
          <div className="flex items-center gap-2 mb-2">
            <Gift className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-semibold text-amber-800">Vos Bonus Inclus</span>
            <span className="ml-auto text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">GRATUIT</span>
          </div>
          <div className="space-y-1.5">
            {/* Bonus panels */}
            <div className="flex items-center gap-2">
              <div className="relative w-8 h-8 rounded overflow-hidden bg-white flex-shrink-0 border border-amber-200">
                <Image src={PANEL_IMAGE} alt="Panneaux Bonus" fill className="object-cover" unoptimized />
              </div>
              <span className="text-xs text-amber-900 flex-1">{bonusData.bonusPanels} Panneaux Bonus</span>
              <Check className="w-3.5 h-3.5 text-green-600" />
            </div>
            {/* Cleaner */}
            {bonusData.cleanerIncluded && (
              <div className="flex items-center gap-2">
                <div className="relative w-8 h-8 rounded overflow-hidden bg-white flex-shrink-0 border border-amber-200">
                  <Image src={CLEANER_IMAGE} alt="Nettoyant Clean" fill className="object-cover" unoptimized />
                </div>
                <span className="text-xs text-amber-900 flex-1">Nettoyant Clean</span>
                <Check className="w-3.5 h-3.5 text-green-600" />
              </div>
            )}
            {/* Technician */}
            {bonusData.technicianIncluded && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-amber-100 flex items-center justify-center flex-shrink-0 border border-amber-200">
                  <Wrench className="w-4 h-4 text-amber-700" />
                </div>
                <span className="text-xs text-amber-900 flex-1">Technicien installation</span>
                <Check className="w-3.5 h-3.5 text-green-600" />
              </div>
            )}
          </div>
          {/* Installation code reminder */}
          <div className="mt-2 pt-2 border-t border-amber-200 flex items-center justify-between">
            <span className="text-[10px] text-amber-700">Code installation :</span>
            <span className="text-xs font-bold text-amber-900 bg-white border border-amber-200 rounded px-2 py-0.5 tracking-wider">
              {bonusData.installationCode}
            </span>
          </div>
        </div>
      )}
    </PayPalCheckout>
  )
}
