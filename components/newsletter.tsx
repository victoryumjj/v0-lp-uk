"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { identifyUser, trackEventWithUser } from "@/lib/tiktok-events"

export function Newsletter() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      // TikTok: Identify user and track CompleteRegistration for newsletter signup
      await identifyUser({ email: email.trim() })
      await trackEventWithUser('CompleteRegistration', {
        value: 0,
        currency: 'GBP',
        description: 'Newsletter signup',
      }, { email: email.trim() })
      
      setSubmitted(true)
      setEmail("")
    }
  }

  return (
    <section className="border-t border-border/50 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="mb-4 inline-block text-xs font-medium uppercase tracking-[0.2em] text-accent">Newsletter</span>
          <h2 className="font-serif text-3xl font-normal sm:text-4xl lg:text-5xl">Rejoignez la Communaute WOOD BOIS</h2>
          <p className="mt-5 text-muted-foreground">
            Inscrivez-vous pour des offres exclusives, de l'inspiration design et un acces anticipe aux nouvelles collections.
          </p>

          {submitted ? (
            <div className="mt-10 border border-border/50 bg-secondary/30 p-8">
              <p className="font-medium">Merci pour votre inscription !</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Nous vous contacterons avec de l'inspiration design et des offres exclusives.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-4 sm:flex-row sm:gap-3">
              <Input
                type="email"
                placeholder="Entrez votre email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-14 flex-1 border-border/50 bg-background px-5 text-base placeholder:text-muted-foreground/60"
              />
              <Button type="submit" size="lg" className="h-14 px-10 text-sm font-medium uppercase tracking-wider">
                S'inscrire
              </Button>
            </form>
          )}

          <p className="mt-6 text-xs text-muted-foreground">
            En vous inscrivant, vous acceptez notre Politique de Confidentialite. Desabonnez-vous a tout moment.
          </p>
        </div>
      </div>
    </section>
  )
}
