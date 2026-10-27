"use client"

import { useState } from "react"
import { Plus } from "lucide-react"

const FAQS = [
  {
    q: "Est-ce que ça tient vraiment sur un mur courbe ou une colonne ?",
    a: "Oui, c'est sa conception principale. Le feutre acoustique de 5mm au dos permet une flexibilité jusqu'à un rayon de 20cm. Des clients l'ont installé sur des colonnes de 18cm de diamètre et des arches. Photos disponibles dans les avis ci-dessous.",
  },
  {
    q: "De quoi ai-je besoin pour installer ? Faut-il un artisan ?",
    a: "Un cutter et une règle. C'est tout. L'adhésif est pré-appliqué et repositionnable pendant 48h. 94% de nos clients posent seuls, sans expérience préalable de rénovation. Temps moyen : 25 minutes par panneau.",
  },
  {
    q: "Que se passe-t-il si je commande trop de panneaux ?",
    a: "Les retours sont gratuits sous 30 jours pour les panneaux non découpés. Notre calculateur inclut 10% de marge pour les chutes. Vous pouvez aussi en commander l'exact minimum et revenir pour compléter si besoin.",
  },
  {
    q: "Est-ce du vrai bois ou un revêtement plastique ?",
    a: "Vrai bois. Les lames sont en MDF massif avec finition bois véritable. Vous pouvez le poncer et le teindre comme n'importe quel bois. Aucun film PVC, aucun papier bois.",
  },
  {
    q: "Le panneau tient-il dans les pièces humides (salle de bain, cuisine) ?",
    a: "Oui pour une utilisation normale. Plusieurs clients l'ont installé en salle de bain et au-dessus de plans de travail. Il ne faut pas l'exposer à de l'eau courante ou à la vapeur directe.",
  },
  {
    q: "Quand vais-je recevoir ma commande ?",
    a: "Expédition sous 24-48h, livraison en 5 à 8 jours ouvrables en France métropolitaine. Vous recevez un email de suivi dès l'expédition. La livraison est gratuite sur toutes les commandes.",
  },
]

export function FAQSectionFr() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="my-12 sm:my-16">
      <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-6">Questions fréquentes</h2>

      <div className="divide-y divide-[#E8DDD4]">
        {FAQS.map((faq, index) => (
          <div key={index} className="overflow-hidden">
            <button
              type="button"
              onClick={() => toggleFaq(index)}
              className="w-full flex items-center justify-between gap-4 py-4 text-left"
            >
              <span className="font-medium text-foreground text-sm sm:text-base">{faq.q}</span>
              <span
                className={`w-6 h-6 rounded-full border border-[#E8DDD4] flex items-center justify-center flex-shrink-0 text-primary transition-transform duration-200 ${
                  openIndex === index ? "rotate-45 border-primary" : ""
                }`}
              >
                <Plus className="w-4 h-4" />
              </span>
            </button>
            <div
              className="grid transition-all duration-300 ease-out"
              style={{
                gridTemplateRows: openIndex === index ? "1fr" : "0fr",
              }}
            >
              <div className="overflow-hidden">
                <p className="text-sm text-muted-foreground leading-relaxed pb-4">{faq.a}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
