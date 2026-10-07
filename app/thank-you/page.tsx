import { redirect } from "next/navigation"

// Legacy thank-you page. Payments confirm on /success-uk and /succes-fr
// (Stripe), so old links are sent to the home page.
export default function ThankYouPage() {
  redirect("/")
}
