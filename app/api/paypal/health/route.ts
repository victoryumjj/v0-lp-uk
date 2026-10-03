import { NextResponse, type NextRequest } from "next/server"
import { createPayPalOrder, generateClientToken, getPayPalEnv, PayPalApiError } from "@/lib/paypal/client"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Diagnostic: checks the PayPal setup step by step and returns ONLY status codes
 * (never keys or tokens). Open /api/paypal/health in the browser.
 * The test order is never captured: it expires on its own and charges nobody.
 */
function describe(err: unknown) {
  if (err instanceof PayPalApiError) return { ok: false, status: err.status, code: err.issue || null, ref: err.debugId || null }
  return { ok: false, code: err instanceof Error ? err.message.slice(0, 120) : "UNKNOWN" }
}

export async function GET(request: NextRequest) {
  const clientId = process.env.PAYPAL_CLIENT_ID || ""
  const result: Record<string, unknown> = {
    env: getPayPalEnv(),
    envVarRaw: process.env.PAYPAL_ENV ?? "(not set → sandbox)",
    clientIdSet: clientId.length > 0,
    clientIdLength: clientId.length,
    secretSet: Boolean(process.env.PAYPAL_CLIENT_SECRET),
    webhookIdSet: Boolean(process.env.PAYPAL_WEBHOOK_ID),
    vercelEnv: process.env.VERCEL_ENV || "unknown",
  }

  const host = (request.headers.get("x-forwarded-host") || request.headers.get("host") || "").split(",")[0].trim().split(":")[0]
  try {
    await generateClientToken(host)
    result.clientToken = { ok: true, domain: host }
  } catch (err) {
    result.clientToken = { ...describe(err), domain: host }
  }

  try {
    const order = await createPayPalOrder(
      {
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: "HEALTHCHECK",
            amount: { currency_code: "GBP", value: "1.00" },
          },
        ],
      },
      crypto.randomUUID(),
    )
    result.createOrderGBP = { ok: true, status: order.status }
  } catch (err) {
    result.createOrderGBP = describe(err)
  }

  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } })
}
