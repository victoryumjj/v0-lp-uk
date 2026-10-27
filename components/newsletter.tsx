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
    <section className="px-3 py-12 sm:px-4 lg:px-6 lg:py-16">
      <div className="mx-auto max-w-7xl rounded-[40px] bg-foreground px-6 py-16 text-card sm:px-10 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <span className="mb-4 inline-block text-xs font-semibold uppercase tracking-[0.2em] text-card/70">Newsletter</span>
          <h2 className="font-serif text-4xl font-medium sm:text-5xl lg:text-6xl">Join the SLATURA WOOD Community</h2>
          <p className="mt-5 text-card/80">
            Sign up for exclusive offers, design inspiration and early access to new collections.
          </p>

          {submitted ? (
            <div className="mt-10 rounded-[28px] border border-card/20 bg-card/10 p-8">
              <p className="font-medium">Thank you for signing up!</p>
              <p className="mt-2 text-sm text-card/80">
                We will be in touch with design inspiration and exclusive offers.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-2 rounded-[32px] bg-card p-2 sm:flex-row sm:rounded-full">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 flex-1 rounded-full border-0 bg-transparent px-5 text-base text-foreground shadow-none placeholder:text-muted-foreground focus-visible:ring-0"
              />
              <Button type="submit" size="lg" className="h-12 px-8 text-sm uppercase tracking-wider">
                Subscribe
              </Button>
            </form>
          )}

          <p className="mt-6 text-xs text-card/70">
            By signing up, you agree to our Privacy Policy. Unsubscribe at any time.
          </p>
        </div>
      </div>
    </section>
  )
}
