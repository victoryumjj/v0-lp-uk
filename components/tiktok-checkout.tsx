'use client'

import { useEffect } from 'react'
import Script from 'next/script'
import { useSearchParams } from 'next/navigation'

// Declare TikTok Pixel global type
declare global {
  interface Window {
    ttq?: {
      track: (eventName: string, data: Record<string, any>, options?: Record<string, any>) => void
      page: () => void
    }
  }
}

export function TikTokCheckout() {
  const searchParams = useSearchParams()
  const success = searchParams.get('success')

  // Evento 1: InitiateCheckout - quando o componente monta
  useEffect(() => {
    // Wait for TikTok script to load (up to 2 seconds)
    let attempts = 0
    const maxAttempts = 20

    const checkAndTrack = () => {
      attempts++
      
      if (typeof window !== 'undefined' && window.ttq) {
        console.log('[v0] TikTok - Script loaded, tracking InitiateCheckout')
        window.ttq.track('InitiateCheckout', {
          value: 0,
          currency: 'GBP',
        })
        console.log('[v0] TikTok - InitiateCheckout event dispatched')
        return
      }

      if (attempts < maxAttempts) {
        console.log(`[v0] TikTok - Waiting for script... (attempt ${attempts}/${maxAttempts})`)
        setTimeout(checkAndTrack, 100)
      } else {
        console.warn('[v0] TikTok - Script not available after 2 seconds')
      }
    }

    // Start checking after a small delay to let script load
    setTimeout(checkAndTrack, 100)
  }, [])

  // Evento 3: Purchase - quando compra é confirmada
  useEffect(() => {
    if (success === 'true') {
      let attempts = 0
      const maxAttempts = 20

      const trackPurchase = () => {
        attempts++

        if (typeof window !== 'undefined' && window.ttq) {
          console.log('[v0] TikTok - Script loaded, tracking Purchase')
          
          // Get cart data from session storage
          const cartData = sessionStorage.getItem('tiktok_purchase_data')
          
          if (cartData) {
            try {
              const data = JSON.parse(cartData)
              console.log('[v0] TikTok - Purchase data found:', data)
              
              window.ttq.track('Purchase', {
                contents: data.contents || [],
                value: data.value || 0,
                currency: data.currency || 'GBP',
                description: data.description || '',
              }, {
                event_id: data.event_id,
              })
              
              console.log('[v0] TikTok - Purchase event dispatched with data')
              sessionStorage.removeItem('tiktok_purchase_data')
            } catch (e) {
              console.error('[v0] Error parsing purchase data:', e)
            }
          } else {
            console.warn('[v0] TikTok - No purchase data in sessionStorage')
            // Fallback Purchase event
            window.ttq.track('Purchase', {
              value: 0,
              currency: 'GBP',
            })
            console.log('[v0] TikTok - Purchase event dispatched (fallback)')
          }
          return
        }

        if (attempts < maxAttempts) {
          console.log(`[v0] TikTok - Waiting for Purchase script... (attempt ${attempts}/${maxAttempts})`)
          setTimeout(trackPurchase, 100)
        } else {
          console.warn('[v0] TikTok - Script not available for Purchase tracking')
        }
      }

      // Start checking immediately for Purchase event
      trackPurchase()
    }
  }, [success])

  const handleScriptLoad = () => {
    console.log('[v0] TikTok - Script element loaded')
    
    // Verify script is available
    if (typeof window !== 'undefined' && window.ttq) {
      console.log('[v0] TikTok - ttq object confirmed available')
    }
  }

  return (
    <>
      {/* TikTok Pixel Script */}
      <Script
        id="tiktok-pixel-checkout"
        strategy="afterInteractive"
        onLoad={handleScriptLoad}
        dangerouslySetInnerHTML={{
          __html: `
            !function (w, d, t) {
              w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
              ttq.load('${process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID}');
              ttq.page();
              console.log('[v0] TikTok - Pixel initialized');
            }(window, document, 'ttq');
          `,
        }}
      />
    </>
  )
}
