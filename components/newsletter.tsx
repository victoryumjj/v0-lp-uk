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
          <h2 className="font-serif text-3xl font-normal sm:text-4xl lg:text-5xl">Join the SLATURA WOOD Community</h2>
          <p className="mt-5 text-muted-foreground">
            Sign up for exclusive offers, design inspiration, and early access to new collections.
          </p>

          {submitted ? (
            <div className="mt-10 border border-border/50 bg-secondary/30 p-8">
              <p className="font-medium">Thank you for subscribing!</p>
              <p className="mt-2 text-sm text-muted-foreground">
                We'll be in touch with design inspiration and exclusive offers.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-4 sm:flex-row sm:gap-3">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-14 flex-1 border-border/50 bg-background px-5 text-base placeholder:text-muted-foreground/60"
              />
              <Button type="submit" size="lg" className="h-14 px-10 text-sm font-medium uppercase tracking-wider">
                Subscribe
              </Button>
            </form>
          )}

          <p className="mt-6 text-xs text-muted-foreground">
            By subscribing, you agree to our Privacy Policy. Unsubscribe at any time.
          </p>
        </div>
      </div>
    </section>
  )
}
