import { redirect } from "next/navigation"

// This page only served the old Stripe checkout. Payments now go through PayPal
// (/success-uk and /succes-fr), so old links are sent to the home page.
export default function ThankYouPage() {
  redirect("/")
}
