import "server-only"

/**
 * PayPal REST client (Orders v2 + Webhooks) — server-side only.
 *
 * Credentials come exclusively from environment variables:
 *   PAYPAL_ENV            "sandbox" (default) | "live"
 *   PAYPAL_CLIENT_ID      REST app client ID
 *   PAYPAL_CLIENT_SECRET  REST app secret (NEVER expose to the browser)
 *   PAYPAL_WEBHOOK_ID     ID of the webhook registered in the PayPal app
 */

export type PayPalEnv = "sandbox" | "live"

export function getPayPalEnv(): PayPalEnv {
  return process.env.PAYPAL_ENV === "live" ? "live" : "sandbox"
}

function getApiBase(): string {
  return getPayPalEnv() === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com"
}

export function getPublicClientId(): string {
  const id = process.env.PAYPAL_CLIENT_ID
  if (!id) throw new Error("PAYPAL_CLIENT_ID is not configured")
  return id
}

function getCredentials() {
  const clientId = process.env.PAYPAL_CLIENT_ID
  const secret = process.env.PAYPAL_CLIENT_SECRET
  if (!clientId || !secret) {
    throw new Error("PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET are not configured")
  }
  return { clientId, secret }
}

// ─── OAuth token (cached per serverless instance) ────────────────────────────
let cachedToken: { value: string; expiresAt: number } | null = null

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value

  const { clientId, secret } = getCredentials()
  const res = await fetch(`${getApiBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  })

  if (!res.ok) {
    // Do not log the response body: it may echo credentials-related info
    throw new PayPalApiError(`PayPal auth failed (${res.status})`, res.status)
  }

  const json = (await res.json()) as { access_token: string; expires_in: number }
  cachedToken = { value: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 }
  return json.access_token
}

/**
 * Browser-safe SDK token bound to the given domain (Web SDK v6 `clientToken`).
 * Init via a domain-bound token avoids eligibility failures that occur with bare
 * clientId init on live apps whose domain isn't registered in the PayPal dashboard.
 */
export async function generateClientToken(domain: string): Promise<string> {
  const { clientId, secret } = getCredentials()
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    response_type: "client_token",
    intent: "sdk_init",
  })
  body.append("domains[]", domain)

  const res = await fetch(`${getApiBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
    cache: "no-store",
  })

  if (!res.ok) throw new PayPalApiError(`PayPal client token failed (${res.status})`, res.status)
  const json = (await res.json()) as { access_token: string }
  return json.access_token
}

// ─── Errors ──────────────────────────────────────────────────────────────────
export class PayPalApiError extends Error {
  status: number
  issue?: string
  debugId?: string
  constructor(message: string, status: number, issue?: string, debugId?: string) {
    super(message)
    this.name = "PayPalApiError"
    this.status = status
    this.issue = issue
    this.debugId = debugId
  }
}

async function paypalRequest<T>(
  path: string,
  init: { method: "GET" | "POST"; body?: string; requestId?: string },
): Promise<T> {
  const token = await getAccessToken()
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  }
  // PayPal-Request-Id makes POSTs idempotent (safe retries / double clicks / webhook races)
  if (init.requestId) headers["PayPal-Request-Id"] = init.requestId

  const res = await fetch(`${getApiBase()}${path}`, {
    method: init.method,
    headers,
    body: init.body,
    cache: "no-store",
  })

  const text = await res.text()
  let json: any = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = null
  }

  if (!res.ok) {
    const issue: string | undefined = json?.details?.[0]?.issue || json?.name
    throw new PayPalApiError(
      `PayPal ${init.method} ${path} failed (${res.status}${issue ? `: ${issue}` : ""})`,
      res.status,
      issue,
      json?.debug_id,
    )
  }

  return json as T
}

// ─── Types (subset of Orders v2 we actually use) ─────────────────────────────
export interface PayPalMoney {
  currency_code: string
  value: string
}

export interface PayPalItem {
  name: string
  sku?: string
  quantity: string
  unit_amount: PayPalMoney
  category?: string
}

export interface PayPalCapture {
  id: string
  status: "COMPLETED" | "DECLINED" | "PARTIALLY_REFUNDED" | "PENDING" | "REFUNDED" | "FAILED"
  amount?: PayPalMoney
  create_time?: string
  supplementary_data?: { related_ids?: { order_id?: string } }
}

export interface PayPalPurchaseUnit {
  reference_id?: string
  custom_id?: string
  amount: PayPalMoney & {
    breakdown?: {
      item_total?: PayPalMoney
      shipping?: PayPalMoney
      discount?: PayPalMoney
      tax_total?: PayPalMoney
      handling?: PayPalMoney
      insurance?: PayPalMoney
      shipping_discount?: PayPalMoney
    }
  }
  items?: PayPalItem[]
  shipping?: {
    name?: { full_name?: string }
    address?: {
      address_line_1?: string
      address_line_2?: string
      admin_area_2?: string
      admin_area_1?: string
      postal_code?: string
      country_code?: string
    }
  }
  payments?: { captures?: PayPalCapture[] }
}

export interface PayPalOrder {
  id: string
  status: "CREATED" | "SAVED" | "APPROVED" | "VOIDED" | "COMPLETED" | "PAYER_ACTION_REQUIRED"
  intent?: string
  create_time?: string
  purchase_units: PayPalPurchaseUnit[]
  payer?: {
    email_address?: string
    payer_id?: string
    name?: { given_name?: string; surname?: string }
    phone?: { phone_number?: { national_number?: string } }
  }
}

// ─── Orders API ──────────────────────────────────────────────────────────────
export function createPayPalOrder(body: unknown, requestId: string) {
  return paypalRequest<PayPalOrder>("/v2/checkout/orders", {
    method: "POST",
    body: JSON.stringify(body),
    requestId,
  })
}

export function getPayPalOrder(orderId: string) {
  return paypalRequest<PayPalOrder>(`/v2/checkout/orders/${encodeURIComponent(orderId)}`, { method: "GET" })
}

export function capturePayPalOrder(orderId: string) {
  // Deterministic request id: the client capture and the webhook capture can never charge twice
  return paypalRequest<PayPalOrder>(`/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
    method: "POST",
    body: "{}",
    requestId: `capture-${orderId}`,
  })
}

// ─── Webhook signature verification ─────────────────────────────────────────
export async function verifyPayPalWebhook(headers: Headers, rawBody: string): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID
  if (!webhookId) {
    console.error("[PayPal Webhook] PAYPAL_WEBHOOK_ID is not configured — rejecting event")
    return false
  }

  const authAlgo = headers.get("paypal-auth-algo")
  const certUrl = headers.get("paypal-cert-url")
  const transmissionId = headers.get("paypal-transmission-id")
  const transmissionSig = headers.get("paypal-transmission-sig")
  const transmissionTime = headers.get("paypal-transmission-time")

  if (!authAlgo || !certUrl || !transmissionId || !transmissionSig || !transmissionTime) return false

  // The raw event body is embedded as-is (not re-serialized) so the signature check
  // runs against the exact bytes PayPal sent.
  const body =
    `{"auth_algo":${JSON.stringify(authAlgo)},` +
    `"cert_url":${JSON.stringify(certUrl)},` +
    `"transmission_id":${JSON.stringify(transmissionId)},` +
    `"transmission_sig":${JSON.stringify(transmissionSig)},` +
    `"transmission_time":${JSON.stringify(transmissionTime)},` +
    `"webhook_id":${JSON.stringify(webhookId)},` +
    `"webhook_event":${rawBody}}`

  try {
    const result = await paypalRequest<{ verification_status: string }>("/v1/notifications/verify-webhook-signature", {
      method: "POST",
      body,
    })
    return result.verification_status === "SUCCESS"
  } catch (err) {
    console.error("[PayPal Webhook] Verification request failed:", err instanceof Error ? err.message : err)
    return false
  }
}
