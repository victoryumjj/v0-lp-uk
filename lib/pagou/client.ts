import "server-only"
import { createHmac, timingSafeEqual } from "node:crypto"

/**
 * Pagou.ai API v2 client — server-side only.
 * Docs: https://developer.pagou.ai (OpenAPI v2: /api-reference/openapi-v2.json)
 * Checkout links: POST /v2/checkout-links (GBP/EUR supported, hosted page)
 * Note: Pagou idempotency is `external_ref` in the body; checkout links have no
 * external_ref and do not move money, so no idempotency field is sent.
 *
 * Env vars (Vercel only, never in the browser):
 *   PAGOU_ENV             "sandbox" (default) | "production"
 *   PAGOU_API_KEY         secret API key for the selected environment
 *   PAGOU_WEBHOOK_SECRET  webhook "Security Token" (Settings → Integrations)
 */

function baseUrl() {
  return process.env.PAGOU_ENV === "production" ? "https://api.pagou.ai" : "https://api.sandbox.pagou.ai"
}

export class PagouApiError extends Error {
  status: number
  code?: string
  requestId?: string
  constructor(message: string, status: number, code?: string, requestId?: string) {
    super(message)
    this.name = "PagouApiError"
    this.status = status
    this.code = code
    this.requestId = requestId
  }
}

async function pagouRequest<T>(path: string, init: { method: "GET" | "POST"; body?: unknown }) {
  const key = process.env.PAGOU_API_KEY
  if (!key) throw new PagouApiError("PAGOU_API_KEY is not configured", 500, "NOT_CONFIGURED")

  const headers: Record<string, string> = {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  }

  const res = await fetch(`${baseUrl()}${path}`, {
    method: init.method,
    headers,
    body: init.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  })
  const text = await res.text()
  let json: any = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {}

  if (!res.ok) {
    // 422 → { error, message, status } · others → RFC 7807 { title, detail, status }
    const detail = json?.message || json?.detail
    throw new PagouApiError(
      `Pagou ${init.method} ${path} failed (${res.status})${detail ? `: ${String(detail).slice(0, 200)}` : ""}`,
      res.status,
      json?.error || json?.title || undefined,
      json?.requestId,
    )
  }
  return json as T
}

// ─── Checkout links (hosted checkout — supports GBP / EUR) ──────────────────
export interface CheckoutLinkProduct {
  external_id: string
  name: string
  price: number // cents
  quantity: number
  currency: "GBP" | "EUR"
  type: "physical"
  image_url?: string
}

export function createCheckoutLink(body: { title: string; currency: "GBP" | "EUR"; products: CheckoutLinkProduct[] }) {
  return pagouRequest<{ success: boolean; requestId: string; data: { url: string } }>("/v2/checkout-links", {
    method: "POST",
    body,
  })
}

// ─── Transactions (read-only, for webhook reconciliation) ───────────────────
export interface PagouTransaction {
  id: string
  amount: number
  currency: string
  status: string
  paid_amount: number
  paid_at?: string | null
}

export function getTransaction(id: string) {
  return pagouRequest<{ success: boolean; requestId: string; data: PagouTransaction }>(
    `/v2/transactions/${encodeURIComponent(id)}`,
    { method: "GET" },
  )
}

// ─── Webhook signature: HMAC-SHA256 of "{timestamp}.{rawBody}" ──────────────
export function verifyPagouWebhook(headers: Headers, rawBody: string): boolean {
  const secret = process.env.PAGOU_WEBHOOK_SECRET
  if (!secret) {
    console.error("[Pagou Webhook] PAGOU_WEBHOOK_SECRET is not configured — rejecting event")
    return false
  }
  const timestamp = headers.get("x-pagou-timestamp") || ""
  const signature = headers.get("x-pagou-signature") || ""
  if (!timestamp || !signature.startsWith("sha256=")) return false

  // Reject old deliveries (replay protection, 10 min window)
  const ts = Number(timestamp)
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > 600) return false

  const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex")
  const received = signature.slice("sha256=".length)
  const a = Buffer.from(expected, "hex")
  const b = Buffer.from(received, "hex")
  return a.length === b.length && timingSafeEqual(a, b)
}
