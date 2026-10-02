import { NextResponse } from "next/server"
import { getPayPalEnv, getPublicClientId } from "@/lib/paypal/client"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** Browser-safe config: the client ID is public by design. The secret never leaves the server. */
export async function GET() {
  try {
    return NextResponse.json({ clientId: getPublicClientId(), env: getPayPalEnv() })
  } catch {
    return NextResponse.json({ error: "Payment is not configured" }, { status: 500 })
  }
}
