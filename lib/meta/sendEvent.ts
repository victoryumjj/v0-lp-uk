// lib/meta/sendEvent.ts
import crypto from "crypto"
import { hashUserData } from "./hash"

// ---------------------------------------------------------------------------
// Multi-pixel configuration (one per currency / market)
// Each entry maps a currency code to its own Pixel ID + Access Token.
// Set the corresponding env vars in Vercel → Project → Environment Variables.
// ---------------------------------------------------------------------------
export interface PixelConfig {
  pixelId: string
  accessToken: string
}

// Returns the pixel that matches the given currency, falling back to the
// primary pixel defined by META_PIXEL_ID / META_ACCESS_TOKEN.
export function getPixelForCurrency(currency: string): PixelConfig {
  const upper = (currency || "").toUpperCase()

  const map: Record<string, { idEnv: string; tokenEnv: string }> = {
    GBP: { idEnv: "META_PIXEL_ID_GBP", tokenEnv: "META_ACCESS_TOKEN_GBP" },
    USD: { idEnv: "META_PIXEL_ID_USD", tokenEnv: "META_ACCESS_TOKEN_USD" },
    EUR: { idEnv: "META_PIXEL_ID_EUR", tokenEnv: "META_ACCESS_TOKEN_EUR" },
  }

  const entry = map[upper]
  if (entry) {
    const pixelId = process.env[entry.idEnv]
    const accessToken = process.env[entry.tokenEnv]
    if (pixelId && accessToken) {
      return { pixelId, accessToken }
    }
  }

  // Fallback to primary pixel
  return {
    pixelId: process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || process.env.META_PIXEL_ID || "992482810135395",
    accessToken: process.env.FACEBOOK_TOKEN || process.env.META_ACCESS_TOKEN || "",
  }
}

// Returns ALL configured pixels (one per currency), deduplicating by pixelId.
export function getAllConfiguredPixels(): PixelConfig[] {
  const currencies = ["GBP", "USD", "EUR"]
  const seen = new Set<string>()
  const result: PixelConfig[] = []

  for (const cur of currencies) {
    const cfg = getPixelForCurrency(cur)
    if (cfg.pixelId && cfg.accessToken && !seen.has(cfg.pixelId)) {
      seen.add(cfg.pixelId)
      result.push(cfg)
    }
  }

  // Ensure primary pixel is always included
  const primary = {
    pixelId: process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || process.env.META_PIXEL_ID || "992482810135395",
    accessToken: process.env.FACEBOOK_TOKEN || process.env.META_ACCESS_TOKEN || "",
  }
  if (primary.pixelId && primary.accessToken && !seen.has(primary.pixelId)) {
    result.push(primary)
  }

  return result
}

export interface MetaEventData {
  eventName: string
  eventTime?: number
  eventId?: string
  eventSourceUrl?: string
  actionSource?: "website"
  userData?: {
    email?: string
    phone?: string
    firstName?: string
    lastName?: string
    city?: string
    state?: string
    zip?: string
    country?: string
    externalId?: string
    clientIpAddress?: string
    clientUserAgent?: string
    fbc?: string
    fbp?: string
  }
  customData?: {
    value?: number
    currency?: string
    contentIds?: string[]
    contentType?: string
    contentName?: string
    contentCategory?: string
    numItems?: number
    orderId?: string
    contents?: Array<{ id: string; quantity: number; item_price?: number }>
    [key: string]: any
  }
}

export interface MetaApiResponse {
  events_received?: number
  messages?: string[]
  fbtrace_id?: string
  error?: {
    message: string
    type: string
    code: number
    fbtrace_id: string
  }
}

// Internal helper: sends one event to a specific pixel
async function _sendToPixel(
  data: MetaEventData,
  pixel: PixelConfig,
): Promise<MetaApiResponse> {
  const { pixelId, accessToken } = pixel

  if (!accessToken) {
    const errorMsg = `[Meta CAPI] ❌ ERRO CRÍTICO: Access Token vazio para pixel ${pixelId}. Configure META_ACCESS_TOKEN em Vercel → Project → Environment Variables`
    console.error(errorMsg)
    throw new Error(errorMsg)
  }

  const hashed = data.userData
    ? hashUserData({
        email: data.userData.email,
        phone: data.userData.phone,
        firstName: data.userData.firstName,
        lastName: data.userData.lastName,
        city: data.userData.city,
        state: data.userData.state,
        zip: data.userData.zip,
        country: data.userData.country,
        externalId: data.userData.externalId,
      })
    : {}

  const eventPayload = {
    event_name: data.eventName,
    event_time: data.eventTime || Math.floor(Date.now() / 1000),
    event_id: data.eventId || crypto.randomUUID(),
    action_source: data.actionSource || "website",
    event_source_url: data.eventSourceUrl,
    user_data: {
      ...hashed,
      ...(data.userData?.clientIpAddress && { client_ip_address: data.userData.clientIpAddress }),
      ...(data.userData?.clientUserAgent && { client_user_agent: data.userData.clientUserAgent }),
      ...(data.userData?.fbc && { fbc: data.userData.fbc }),
      ...(data.userData?.fbp && { fbp: data.userData.fbp }),
    },
    custom_data: data.customData
      ? {
          ...(data.customData.value !== undefined && { value: data.customData.value }),
          ...(data.customData.currency && { currency: data.customData.currency.toUpperCase() }),
          ...(data.customData.contentIds && { content_ids: data.customData.contentIds }),
          ...(data.customData.contents && { contents: data.customData.contents }),
          ...(data.customData.contentType && { content_type: data.customData.contentType }),
          ...(data.customData.contentName && { content_name: data.customData.contentName }),
          ...(data.customData.contentCategory && { content_category: data.customData.contentCategory }),
          ...(data.customData.numItems !== undefined && { num_items: data.customData.numItems }),
          ...(data.customData.orderId && { order_id: data.customData.orderId }),
          ...Object.fromEntries(
            Object.entries(data.customData).filter(
              ([k]) =>
                ![
                  "value",
                  "currency",
                  "contentIds",
                  "contents",
                  "contentType",
                  "contentName",
                  "contentCategory",
                  "numItems",
                  "orderId",
                ].includes(k),
            ),
          ),
        }
      : undefined,
  }

  const testEventCode = process.env.META_TEST_EVENT_CODE
  const apiPayload: { data: typeof eventPayload[]; test_event_code?: string } = {
    data: [eventPayload],
  }
  if (testEventCode) apiPayload.test_event_code = testEventCode

  // Log do envio da requisição
  console.log(`[Meta CAPI] 📤 Enviando evento ${data.eventName} para pixel ${pixelId} (moeda: ${data.customData?.currency || 'N/A'})`)

  const res = await fetch(`https://graph.facebook.com/v20.0/${pixelId}/events?access_token=${accessToken}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(apiPayload),
  })

  const json: MetaApiResponse = await res.json()

  if (!res.ok || json.error) {
    const errorMsg = json.error?.message || "Meta API error"
    console.error(`[Meta CAPI] ❌ Erro na API: ${errorMsg}`)
    throw new Error(errorMsg)
  }

  // Log de sucesso
  console.log(`[Meta CAPI] ✅ Evento ${data.eventName} enviado com sucesso (eventID: ${data.eventId}, pixelID: ${pixelId})`)

  return json
}

// Sends an event to the primary pixel (backward-compatible)
export async function sendMetaEvent(data: MetaEventData): Promise<MetaApiResponse> {
  const pixel: PixelConfig = {
    pixelId: process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || process.env.META_PIXEL_ID || "992482810135395",
    accessToken: process.env.FACEBOOK_TOKEN || process.env.META_ACCESS_TOKEN || "",
  }
  return _sendToPixel(data, pixel)
}

// Sends an event to the pixel that matches the given currency
export async function sendMetaEventForCurrency(
  data: MetaEventData,
  currency: string,
): Promise<MetaApiResponse> {
  const pixel = getPixelForCurrency(currency)
  return _sendToPixel(data, pixel)
}

// Sends an event directly to the UK pixel 1440709523610900
export async function sendMetaEventToUKPixel(data: MetaEventData): Promise<MetaApiResponse> {
  const ukPixel: PixelConfig = {
    pixelId: "1440709523610900",
    accessToken: process.env.META_ACCESS_TOKEN_GBP || process.env.META_ACCESS_TOKEN || "",
  }
  
  if (!ukPixel.accessToken) {
    console.warn("[Meta CAPI] ⚠️ META_ACCESS_TOKEN_GBP não configurado para pixel UK 1440709523610900")
    return { events_received: 0, messages: ["Access token not configured for UK pixel"] }
  }
  
  return _sendToPixel(data, ukPixel)
}

// Sends Purchase event to ALL configured pixels (for cross-market tracking)
export async function sendPurchaseEventToAllPixels(params: {
  value: number
  currency: string
  orderId: string
  contentIds?: string[]
  contents?: Array<{ id: string; quantity: number; item_price?: number }>
  email?: string
  phone?: string
  firstName?: string
  lastName?: string
  city?: string
  state?: string
  zip?: string
  country?: string
  externalId?: string
  clientIpAddress?: string
  clientUserAgent?: string
  fbc?: string
  fbp?: string
  eventSourceUrl?: string
  eventId?: string
  eventTime?: number
}): Promise<{ pixelId: string; result: MetaApiResponse }[]> {
  const eventData: MetaEventData = {
    eventName: "Purchase",
    eventTime: params.eventTime,
    eventId: params.eventId,
    eventSourceUrl: params.eventSourceUrl,
    actionSource: "website",
    userData: {
      email: params.email,
      phone: params.phone,
      firstName: params.firstName,
      lastName: params.lastName,
      city: params.city,
      state: params.state,
      zip: params.zip,
      country: params.country,
      externalId: params.externalId,
      clientIpAddress: params.clientIpAddress,
      clientUserAgent: params.clientUserAgent,
      fbc: params.fbc,
      fbp: params.fbp,
    },
    customData: {
      value: params.value,
      currency: params.currency,
      orderId: params.orderId,
      contentIds: params.contentIds,
      contents: params.contents,
      contentType: "product",
    },
  }

  const results: { pixelId: string; result: MetaApiResponse }[] = []

  // List of all pixels to send to
  const pixelsToSend = [
    { pixelId: "992482810135395", accessToken: process.env.META_ACCESS_TOKEN || process.env.FACEBOOK_TOKEN || "" },
    { pixelId: "1309753271055484", accessToken: process.env.META_ACCESS_TOKEN_EUR || process.env.META_ACCESS_TOKEN || "" },
    { pixelId: "1440709523610900", accessToken: process.env.META_ACCESS_TOKEN_GBP || process.env.META_ACCESS_TOKEN || "" },
    { pixelId: "1200200552118123", accessToken: process.env.META_ACCESS_TOKEN_UK2 || "EAAFFeozJ3JUBRsPZB828NsSwmmz5TrVur6FZBGpagmYaeG0Lw6WbiO8oQYTnS87ZBQHDKdtHb9ijOY4ipZB7OI8S6f2qPZAGgzshoMwvH3ydM8uvtamcq6ByTx7jiG1ca4rv7eFAG6PPO7EVr5LWI2ZAbORwPHpF3rkMHZBS6080ZAR5RQnVTDjOm88b2NiP9AZDZD" },
  ]

  for (const pixel of pixelsToSend) {
    if (!pixel.accessToken) {
      console.warn(`[Meta CAPI] ⚠️ Access token não configurado para pixel ${pixel.pixelId}`)
      continue
    }

    try {
      // Use unique event ID per pixel to avoid deduplication issues
      const pixelEventData = {
        ...eventData,
        eventId: `${params.eventId || params.orderId}_${pixel.pixelId.slice(-4)}`,
      }
      const result = await _sendToPixel(pixelEventData, pixel)
      results.push({ pixelId: pixel.pixelId, result })
      console.log(`[Meta CAPI] ✅ Purchase enviado para pixel ${pixel.pixelId}`)
    } catch (error) {
      console.error(`[Meta CAPI] ❌ Erro ao enviar para pixel ${pixel.pixelId}:`, error)
      results.push({ pixelId: pixel.pixelId, result: { error: { message: String(error), type: "api_error", code: 500, fbtrace_id: "" } } })
    }
  }

  return results
}

export async function sendPurchaseEvent(params: {
  value: number
  currency: string
  orderId: string
  contentIds?: string[]
  contents?: Array<{ id: string; quantity: number; item_price?: number }>
  email?: string
  phone?: string
  firstName?: string
  lastName?: string
  city?: string
  state?: string
  zip?: string
  country?: string
  externalId?: string
  clientIpAddress?: string
  clientUserAgent?: string
  fbc?: string
  fbp?: string
  eventSourceUrl?: string
  eventId?: string
  eventTime?: number
}) {
  const eventData: MetaEventData = {
    eventName: "Purchase",
    eventTime: params.eventTime,
    eventId: params.eventId,
    eventSourceUrl: params.eventSourceUrl,
    userData: {
      email: params.email,
      phone: params.phone,
      firstName: params.firstName,
      lastName: params.lastName,
      city: params.city,
      state: params.state,
      zip: params.zip,
      country: params.country,
      externalId: params.externalId,
      clientIpAddress: params.clientIpAddress,
      clientUserAgent: params.clientUserAgent,
      fbc: params.fbc,
      fbp: params.fbp,
    },
    customData: {
      value: params.value,
      currency: params.currency,
      orderId: params.orderId,
      contentIds: params.contentIds,
      contents: params.contents,
      contentType: "product",
    },
  }

  // Send to the pixel configured for this currency (e.g. GBP → META_PIXEL_ID_GBP)
  // Falls back to the primary pixel if no per-currency pixel is set.
  return sendMetaEventForCurrency(eventData, params.currency)
}
