// Meta Pixel client-side utilities
// Both Pixel IDs - events are tracked to all initialized pixels

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID
export const META_PIXEL_ID_2 = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID_2

// Declare fbq type for TypeScript
declare global {
  interface Window {
    fbq: (...args: unknown[]) => void
    _fbq: unknown
  }
}

// Generate unique event ID for deduplication between Pixel (browser) and CAPI (server)
// IMPORTANT: The SAME eventId must be sent to both fbq() and the /api/meta/track CAPI endpoint.
export function generateEventId(prefix?: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 15)
  return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`
}

// Track ViewContent event (fires ONCE with eventID for deduplication)
export function trackViewContent(params: {
  contentId: string
  contentName: string
  contentType?: string
  value: number
  currency?: string
  eventId?: string
}) {
  const eventId = params.eventId || generateEventId("vc")

  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "ViewContent", {
      content_ids: [params.contentId],
      content_name: params.contentName,
      content_type: params.contentType || "product",
      value: params.value,
      currency: params.currency || "GBP",
    }, { eventID: eventId })
  }

  return eventId
}

// Track AddToCart event (fires ONCE with eventID for deduplication)
export function trackAddToCart(params: {
  contentId: string
  contentName: string
  quantity: number
  value: number
  currency?: string
  eventId?: string
}) {
  const eventId = params.eventId || generateEventId("atc")

  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "AddToCart", {
      content_ids: [params.contentId],
      contents: [
        {
          id: params.contentId,
          quantity: params.quantity,
          item_price: params.value / params.quantity,
        },
      ],
      content_name: params.contentName,
      content_type: "product",
      value: params.value,
      currency: params.currency || "GBP",
    }, { eventID: eventId })
  }

  return eventId
}

// Track InitiateCheckout event (fires ONCE with eventID for deduplication)
export function trackInitiateCheckout(params: {
  contentIds: string[]
  numItems: number
  value: number
  currency?: string
  eventId?: string
}) {
  const eventId = params.eventId || generateEventId("ic")

  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "InitiateCheckout", {
      content_ids: params.contentIds,
      num_items: params.numItems,
      value: params.value,
      currency: params.currency || "GBP",
    }, { eventID: eventId })
  }

  return eventId
}

// Track Purchase event (fires ONLY to pixel 1440709523610900 with eventID for deduplication)
export function trackPurchase(params: {
  orderId: string
  contentIds: string[]
  contents: Array<{ id: string; quantity: number; item_price: number }>
  value: number
  currency?: string
  eventId?: string
}) {
  const eventId = params.eventId || `purchase_${params.orderId}`

  if (typeof window !== "undefined" && window.fbq) {
    // Dispara APENAS para o pixel UK 1440709523610900
    window.fbq("trackSingle", "1440709523610900", "Purchase", {
      content_ids: params.contentIds,
      contents: params.contents,
      content_type: "product",
      value: params.value,
      currency: params.currency || "GBP",
      order_id: params.orderId,
    }, { eventID: eventId })
  }

  return eventId
}

// Track PageView (for SPA navigation)
export function trackPageView() {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "PageView")
  }
}

// Update Meta Pixel with user data for Advanced Matching
// Call this when you have user PII (email, phone) to improve event matching
export function updateMetaUserData(params: {
  email?: string
  phone?: string
  firstName?: string
  lastName?: string
  externalId?: string
}) {
  if (typeof window === "undefined") return
  
  // Store in localStorage for future page loads
  const userData: Record<string, string> = {}
  if (params.email) userData.em = params.email.toLowerCase().trim()
  if (params.phone) userData.ph = params.phone.replace(/\D/g, '')
  if (params.firstName) userData.fn = params.firstName.toLowerCase().trim()
  if (params.lastName) userData.ln = params.lastName.toLowerCase().trim()
  if (params.externalId) userData.external_id = params.externalId
  
  if (Object.keys(userData).length === 0) return
  
  try {
    localStorage.setItem('meta_user_data', JSON.stringify(userData))
  } catch (e) {
    // localStorage may be blocked
  }
  
  // Re-init pixels with user data (Meta Pixel will hash automatically)
  if (window.fbq) {
    // Pixel IDs
    const pixelId1 = "992482810135395"
    const pixelId2 = "1309753271055484"
    const pixelId3 = "1440709523610900"
    const pixelId4 = "1200200552118123"
    
    // Re-init each pixel with Advanced Matching data
    // Note: fbq('init') with same pixel ID updates the user data
    window.fbq('init', pixelId1, userData)
    window.fbq('init', pixelId2, userData)
    window.fbq('init', pixelId3, userData)
    window.fbq('init', pixelId4, userData)
  }
}
