"use client"

import type React from "react"
import { useState } from "react"
import { Mail, MapPin, Clock, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { identifyUser } from "@/lib/tiktok-events"

const faqs = [
  {
    question: "Dans quels pays livrez-vous ?",
    answer:
      "Nous livrons dans toute la France metropolitaine et dans la plupart des pays europeens. La livraison est gratuite pour toutes les commandes de plus de 80 euros en France. Pour les autres pays, les frais de livraison sont calcules a la caisse.",
  },
  {
    question: "Quelle est votre politique de retour ?",
    answer:
      "Nous offrons une politique de retour de 30 jours sur tous les articles non utilises dans leur emballage d'origine. Contactez-nous simplement pour initier un retour, et nous vous fournirons une etiquette d'expedition prepayee. Les remboursements sont traites dans les 5 a 7 jours ouvrables apres reception de l'article.",
  },
  {
    question: "Combien de temps prend la livraison ?",
    answer:
      "La livraison standard prend 5 a 10 jours ouvrables. La livraison express (15 euros) livre dans les 2 a 4 jours ouvrables. Toutes les commandes sont expediees depuis notre entrepot en France.",
  },
  {
    question: "Comment entretenir mes produits en bois ?",
    answer:
      "Nos produits en bois sont finis avec des huiles naturelles qui protegent et ameliorent le grain. Depoussierer regulierement avec un chiffon doux. Pour un nettoyage plus profond, utilisez un chiffon humide et sechez immediatement. Evitez la lumiere directe du soleil et les sources de chaleur. Nous recommandons de re-huiler annuellement avec notre Kit d'Entretien Bois.",
  },
  {
    question: "Offrez-vous des services d'installation ?",
    answer:
      "Nos panneaux muraux sont livres avec des guides d'installation complets et tout le materiel necessaire. Pour une installation professionnelle, nous travaillons avec des installateurs certifies dans les principales villes francaises. Contactez-nous pour un devis.",
  },
]

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border-b border-border">
      <button
        type="button"
        className="flex w-full items-center justify-between py-4 text-left"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-medium">{question}</span>
        <ChevronDown className={cn("h-5 w-5 shrink-0 transition-transform", isOpen && "rotate-180")} />
      </button>
      <div className={cn("grid transition-all duration-200", isOpen ? "grid-rows-[1fr] pb-4" : "grid-rows-[0fr]")}>
        <div className="overflow-hidden">
          <p className="text-muted-foreground">{answer}</p>
        </div>
      </div>
    </div>
  )
}

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // TikTok: Identify user with email from contact form (for future event matching)
    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    if (email) {
      await identifyUser({ email: email.trim() })
    }
    
    setSubmitted(true)
  }

  return (
    <div className="py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="font-serif text-4xl sm:text-5xl">Contactez-Nous</h1>
          <p className="mt-4 text-muted-foreground">
            Vous avez une question sur nos produits ou votre commande ? Nous sommes la pour vous aider.
          </p>
        </div>

        <div className="mt-16 grid gap-16 lg:grid-cols-2">
          {/* Contact Form */}
          <div>
            <h2 className="font-serif text-2xl">Envoyez-Nous un Message</h2>
            {submitted ? (
              <div className="mt-8 rounded-sm bg-secondary p-8 text-center">
                <h3 className="font-serif text-xl">Merci pour votre message !</h3>
                <p className="mt-4 text-muted-foreground">
                  Nous vous repondrons dans les 24 a 48 heures pendant les jours ouvrables.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Prenom</Label>
                    <Input id="firstName" required className="h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nom</Label>
                    <Input id="lastName" required className="h-12" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" required className="h-12" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Sujet</Label>
                  <Input id="subject" required className="h-12" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea id="message" rows={6} required className="resize-none" />
                </div>
                <Button type="submit" size="lg" className="w-full sm:w-auto">
                  Envoyer le Message
                </Button>
              </form>
            )}
          </div>

          {/* Contact Info */}
          <div>
            <h2 className="font-serif text-2xl">Informations de Contact</h2>
            <div className="mt-8 space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-medium">Email</h3>
                  <a href="mailto:contact@woodbois.fr" className="mt-1 text-muted-foreground hover:underline">
                    contact@woodbois.fr
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-medium">Adresse</h3>
                  <p className="mt-1 text-muted-foreground">
                    WOOD BOIS SARL
                    <br />
                    123 Rue du Design
                    <br />
                    75001 Paris
                    <br />
                    France
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-medium">Horaires d'Ouverture</h3>
                  <p className="mt-1 text-muted-foreground">
                    Lundi - Vendredi : 9h00 - 17h00
                    <br />
                    Samedi - Dimanche : Ferme
                  </p>
                </div>
              </div>
            </div>

            {/* Shipping Info */}
            <div id="shipping" className="mt-12 border-t border-border pt-8">
              <h3 className="font-serif text-xl">Informations de Livraison</h3>
              <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                <p>
                  <span className="font-medium text-foreground">Livraison Standard Gratuite :</span> Toutes les commandes France de plus de 80 euros
                </p>
                <p>
                  <span className="font-medium text-foreground">Livraison Express :</span> 15 euros (2-4 jours ouvrables)
                </p>
                <p>
                  <span className="font-medium text-foreground">UE & International :</span> A partir de 25 euros
                </p>
              </div>
            </div>

            {/* Returns Info */}
            <div id="returns" className="mt-8 border-t border-border pt-8">
              <h3 className="font-serif text-xl">Retours & Echanges</h3>
              <p className="mt-4 text-sm text-muted-foreground">
                Nous voulons que vous aimiez votre achat. Si vous n'etes pas completement satisfait, retournez les articles non utilises dans les
                30 jours pour un remboursement complet. Contactez-nous a contact@woodbois.fr pour demarrer votre retour.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <section id="faq" className="mt-24">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center font-serif text-3xl">Questions Frequemment Posees</h2>
            <div className="mt-8">
              {faqs.map((faq, index) => (
                <FAQItem key={index} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          </div>
        </section>

        {/* Care Guide */}
        <section id="care" className="mt-24 border-t border-border pt-16">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-serif text-3xl">Guide d'Entretien des Produits</h2>
            <p className="mt-4 text-muted-foreground">
              Nos produits sont concus pour durer. Avec un entretien adequat, ils deviendront encore plus beaux avec le temps.
            </p>
            <div className="mt-8 grid gap-6 text-left sm:grid-cols-2">
              <div className="bg-secondary p-6">
                <h3 className="font-medium">Produits en Bois</h3>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <li>- Depoussierer regulierement avec un chiffon doux et sec</li>
                  <li>- Eviter la lumiere directe du soleil et les sources de chaleur</li>
                  <li>- Nettoyer avec un chiffon legerement humide si necessaire</li>
                  <li>- Re-huiler annuellement pour de meilleurs resultats</li>
                </ul>
              </div>
              <div className="bg-secondary p-6">
                <h3 className="font-medium">Ceramique & Verre</h3>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <li>- Laver a la main avec un savon doux</li>
                  <li>- Eviter les changements de temperature extremes</li>
                  <li>- Manipuler avec soin - chaque piece est unique</li>
                  <li>- Utiliser des patins en feutre sur les surfaces</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
