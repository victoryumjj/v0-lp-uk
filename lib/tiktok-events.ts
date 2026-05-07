/**
 * TikTok Events Helper
 * Implements all TikTok Pixel events with proper data formatting
 * Includes Advanced Matching with SHA-256 hashed PII
 */

interface TikTokContent {
  content_id?: string
  content_type?: 'product' | 'product_group'
  content_name?: string
  content_category?: string
  price?: number
  num_items?: number
  brand?: string
}

interface TikTokTrackData {
  contents?: TikTokContent[]
  value?: number
  currency?: string
  search_string?: string
  description?: string
  status?: string
}

interface TikTokIdentifyData {
  email?: string
  phone_number?: string
  external_id?: string
}

declare global {
  interface Window {
    ttq?: {
      track: (eventName: string, data: Record<string, any>, options?: Record<string, any>) => void
      identify: (data: Record<string, any>) => void
      page: () => void
    }
    _ttqIdentified?: boolean // Track if user has been identified in this session
  }
}

/**
 * SHA-256 hash function for PII data (client-side using SubtleCrypto)
 * Normalizes input: trim + lowercase before hashing
 */
export async function hashSHA256(value: string): Promise<string> {
  if (!value || typeof value !== 'string') return ''
  
  const normalized = value.trim().toLowerCase()
  if (!normalized) return ''
  
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    try {
      const encoder = new TextEncoder()
      const dataBuffer = encoder.encode(normalized)
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    } catch (e) {
      console.warn('[TikTok] SHA-256 hash failed:', e)
      return ''
    }
  }
  return ''
}

/**
 * Normalize phone number to E.164 format before hashing
 * Removes all non-digit characters, ensures proper format
 */
function normalizePhone(phone: string): string {
  if (!phone || typeof phone !== 'string') return ''
  
  // Remove all non-digit characters except leading +
  let cleaned = phone.replace(/[^\d+]/g, '')
  
  // If starts with +, keep it; otherwise assume it's already digits only
  if (cleaned.startsWith('+')) {
    cleaned = '+' + cleaned.slice(1).replace(/\D/g, '')
  } else {
    cleaned = cleaned.replace(/\D/g, '')
  }
  
  return cleaned
}

/**
 * Wait for TikTok script to load with retries
 */
async function waitForTikTok(maxAttempts = 20, delayMs = 100): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    if (typeof window !== 'undefined' && window.ttq) {
      return true
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs))
  }
  console.warn('[v0] TikTok - Script not available after', maxAttempts * delayMs, 'ms')
  return false
}

/**
 * Identify user with PII data (hashed with SHA-256)
 * Call this BEFORE tracking events to improve EMQ (Event Match Quality)
 * 
 * @param data - User PII: email, phone_number (E.164), external_id
 * @param force - If true, re-identify even if already identified in session
 */
export async function identifyUser(
  data: TikTokIdentifyData,
  force: boolean = false
): Promise<boolean> {
  if (typeof window === 'undefined') return false
  
  // Skip if already identified in this session (unless forced)
  if (window._ttqIdentified && !force) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[TikTok] User already identified in this session, skipping')
    }
    return true
  }
  
  const isAvailable = await waitForTikTok()
  if (!isAvailable || !window.ttq) return false

  const identifyData: Record<string, string> = {}
  
  // Hash email (normalize: trim + lowercase)
  if (data.email && data.email.trim()) {
    const hashedEmail = await hashSHA256(data.email)
    if (hashedEmail) {
      identifyData.email = hashedEmail
    }
  }
  
  // Hash phone (normalize to E.164 format first)
  if (data.phone_number && data.phone_number.trim()) {
    const normalizedPhone = normalizePhone(data.phone_number)
    if (normalizedPhone) {
      const hashedPhone = await hashSHA256(normalizedPhone)
      if (hashedPhone) {
        identifyData.phone_number = hashedPhone
      }
    }
  }
  
  // Hash external_id
  if (data.external_id && data.external_id.trim()) {
    const hashedExternalId = await hashSHA256(data.external_id)
    if (hashedExternalId) {
      identifyData.external_id = hashedExternalId
    }
  }
  
  // Don't call identify with empty data
  if (Object.keys(identifyData).length === 0) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[TikTok] identifyUser called with no valid PII data')
    }
    return false
  }

  try {
    window.ttq.identify(identifyData)
    window._ttqIdentified = true
    
    if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEBUG_PIXELS === 'true') {
      console.log('[TikTok] User identified with:', {
        hasEmail: !!identifyData.email,
        hasPhone: !!identifyData.phone_number,
        hasExternalId: !!identifyData.external_id,
        emailHash: identifyData.email?.substring(0, 8) + '...',
        phoneHash: identifyData.phone_number?.substring(0, 8) + '...',
      })
    }
    return true
  } catch (error) {
    console.error('[TikTok] Error in identifyUser:', error)
    return false
  }
}

/**
 * Legacy alias for identifyUser
 * @deprecated Use identifyUser instead
 */
export async function trackIdentify(data: TikTokIdentifyData) {
  return identifyUser(data)
}

/**
 * Track event with automatic user identification
 * Combines identifyUser + track in one call for convenience
 */
export async function trackEventWithUser(
  eventName: string,
  eventData: TikTokTrackData,
  userData?: TikTokIdentifyData
): Promise<void> {
  // Identify user first if we have PII
  if (userData && (userData.email || userData.phone_number)) {
    await identifyUser(userData)
  }
  
  // Then track the event
  const isAvailable = await waitForTikTok()
  if (!isAvailable || !window.ttq) return

  try {
    window.ttq.track(eventName, {
      contents: eventData.contents || [],
      value: eventData.value || 0,
      currency: eventData.currency || 'GBP',
      description: eventData.description || '',
      status: eventData.status || '',
    })
    
    if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEBUG_PIXELS === 'true') {
      console.log(`[TikTok] ${eventName} tracked with user data:`, {
        value: eventData.value,
        currency: eventData.currency,
        hasUserData: !!(userData?.email || userData?.phone_number),
      })
    }
  } catch (error) {
    console.error(`[TikTok] Error tracking ${eventName}:`, error)
  }
}

/**
 * Track ViewContent event - when user views product/page
 */
export async function trackViewContent(data: TikTokTrackData) {
  const isAvailable = await waitForTikTok()
  if (!isAvailable || !window.ttq) return

  try {
    window.ttq.track('ViewContent', {
      contents: data.contents || [],
      value: data.value || 0,
      currency: data.currency || 'GBP',
      description: data.description || '',
    })
    console.log('[v0] TikTok - ViewContent tracked')
  } catch (error) {
    console.error('[v0] TikTok - Error tracking ViewContent:', error)
  }
}

/**
 * Track AddToWishlist event
 */
export async function trackAddToWishlist(data: TikTokTrackData) {
  const isAvailable = await waitForTikTok()
  if (!isAvailable || !window.ttq) return

  try {
    window.ttq.track('AddToWishlist', {
      contents: data.contents || [],
      value: data.value || 0,
      currency: data.currency || 'GBP',
    })
    console.log('[v0] TikTok - AddToWishlist tracked')
  } catch (error) {
    console.error('[v0] TikTok - Error tracking AddToWishlist:', error)
  }
}

/**
 * Track Search event
 */
export async function trackSearch(searchString: string, data?: TikTokTrackData) {
  const isAvailable = await waitForTikTok()
  if (!isAvailable || !window.ttq) return

  try {
    window.ttq.track('Search', {
      contents: data?.contents || [],
      value: data?.value || 0,
      currency: data?.currency || 'GBP',
      search_string: searchString,
    })
    console.log('[v0] TikTok - Search tracked')
  } catch (error) {
    console.error('[v0] TikTok - Error tracking Search:', error)
  }
}

/**
 * Track AddPaymentInfo event
 */
export async function trackAddPaymentInfo(data: TikTokTrackData) {
  const isAvailable = await waitForTikTok()
  if (!isAvailable || !window.ttq) return

  try {
    window.ttq.track('AddPaymentInfo', {
      contents: data.contents || [],
      value: data.value || 0,
      currency: data.currency || 'GBP',
      description: data.description || '',
    })
    console.log('[v0] TikTok - AddPaymentInfo tracked')
  } catch (error) {
    console.error('[v0] TikTok - Error tracking AddPaymentInfo:', error)
  }
}

/**
 * Track AddToCart event
 */
export async function trackAddToCart(data: TikTokTrackData) {
  const isAvailable = await waitForTikTok()
  if (!isAvailable || !window.ttq) return

  try {
    window.ttq.track('AddToCart', {
      contents: data.contents || [],
      value: data.value || 0,
      currency: data.currency || 'GBP',
      description: data.description || '',
    })
    console.log('[v0] TikTok - AddToCart tracked')
  } catch (error) {
    console.error('[v0] TikTok - Error tracking AddToCart:', error)
  }
}

/**
 * Track InitiateCheckout event
 */
export async function trackInitiateCheckout(data: TikTokTrackData) {
  const isAvailable = await waitForTikTok()
  if (!isAvailable || !window.ttq) return

  try {
    window.ttq.track('InitiateCheckout', {
      contents: data.contents || [],
      value: data.value || 0,
      currency: data.currency || 'GBP',
      description: data.description || '',
    })
    console.log('[v0] TikTok - InitiateCheckout tracked')
  } catch (error) {
    console.error('[v0] TikTok - Error tracking InitiateCheckout:', error)
  }
}

/**
 * Track PlaceAnOrder event
 */
export async function trackPlaceAnOrder(data: TikTokTrackData) {
  const isAvailable = await waitForTikTok()
  if (!isAvailable || !window.ttq) return

  try {
    window.ttq.track('PlaceAnOrder', {
      contents: data.contents || [],
      value: data.value || 0,
      currency: data.currency || 'GBP',
      status: data.status || 'submitted',
    })
    console.log('[v0] TikTok - PlaceAnOrder tracked')
  } catch (error) {
    console.error('[v0] TikTok - Error tracking PlaceAnOrder:', error)
  }
}

/**
 * Track CompleteRegistration event
 */
export async function trackCompleteRegistration(data: TikTokTrackData) {
  const isAvailable = await waitForTikTok()
  if (!isAvailable || !window.ttq) return

  try {
    window.ttq.track('CompleteRegistration', {
      contents: data.contents || [],
      value: data.value || 0,
      currency: data.currency || 'GBP',
      status: data.status || 'completed',
    })
    console.log('[v0] TikTok - CompleteRegistration tracked')
  } catch (error) {
    console.error('[v0] TikTok - Error tracking CompleteRegistration:', error)
  }
}

/**
 * Track Purchase event (with full parameters)
 */
export async function trackPurchase(data: TikTokTrackData) {
  const isAvailable = await waitForTikTok()
  if (!isAvailable || !window.ttq) return

  try {
    window.ttq.track('Purchase', {
      contents: data.contents || [],
      value: data.value || 0,
      currency: data.currency || 'GBP',
      description: data.description || '',
      status: data.status || 'completed',
    })
    console.log('[v0] TikTok - Purchase tracked')
  } catch (error) {
    console.error('[v0] TikTok - Error tracking Purchase:', error)
  }
}

/**
 * Format cart items for TikTok
 */
export function formatCartForTikTok(items: Array<{ product: any; quantity: number }>) {
  return items.map((item) => ({
    content_id: item.product.id,
    content_type: 'product' as const,
    content_name: item.product.name,
    content_category: item.product.category,
    price: item.product.salePrice || item.product.price,
    num_items: item.quantity,
    brand: 'Acoustic Design',
  }))
}

/**
 * Store purchase data for later tracking on success page
 */
export function storePurchaseData(data: TikTokTrackData) {
  if (typeof window === 'undefined') return

  try {
    sessionStorage.setItem('tiktok_purchase_data', JSON.stringify({
      ...data,
      timestamp: new Date().toISOString(),
    }))
    console.log('[v0] TikTok - Purchase data stored')
  } catch (e) {
    console.error('[v0] Error storing purchase data:', e)
  }
}
