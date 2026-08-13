import "server-only"

import Stripe from "stripe"

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_ACCESS_TOKEN

if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY (or STRIPE_ACCESS_TOKEN) environment variable is required")
}

export const stripe = new Stripe(stripeSecretKey, {
  typescript: true,
})
