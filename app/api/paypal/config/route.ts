import { NextResponse, type NextRequest } from "next/server"
import { generateClientToken, getPayPalEnv, getPublicClientId } from "@/lib/paypal/client"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** Browser-safe config: a short-lived domain-bound client token (plus the public client ID as fallback). */
export async function GET(request: NextRequest) {
  let clientId: string
  try {
    clientId = getPublicClientId()
  } catch {
    return NextResponse.json({ error: "Payment is not configured" }, { status: 500 })
  }

  const env = getPayPalEnv()
  const host = (request.headers.get("x-forwarded-host") || request.headers.get("host") || "").split(",")[0].trim()
  const domain = host.split(":")[0]

  let clientToken: string | null = null
  if (domain) {
    try {
      clientToken = await generateClientToken(domain)
    } catch (err) {
      console.error("[PayPal] client token generation failed:", err instanceof Error ? err.message : err)
    }
  }

  return NextResponse.json(
    { clientId, clientToken, env },
    { headers: { "Cache-Control": "no-store" } },
  )
}
