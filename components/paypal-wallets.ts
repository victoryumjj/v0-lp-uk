"use client"

/**
 * Apple Pay + Google Pay through PayPal (JavaScript SDK v6).
 * Based on PayPal's official v6 samples (paypal-examples/v6-web-sdk-sample-integration).
 *
 * - Buttons are only rendered when PayPal reports the method as eligible for this
 *   account AND the device/browser supports it. Otherwise nothing is shown.
 * - The wallet collects the delivery address (UK only for the UK market) and sends it
 *   to /api/paypal/create-order, which re-validates country, products and prices.
 * - Payment is captured by the server (/api/paypal/capture-order), never by the browser.
 */

const APPLE_PAY_SDK = "https://applepay.cdn-apple.com/jsapi/1.latest/apple-pay-sdk.js"
const GOOGLE_PAY_SDK = "https://pay.google.com/gp/p/js/pay.js"

// Name shown in the Apple Pay sheet ("Pay <STORE_LABEL>")
const STORE_LABEL = "Slatura Wood"

export interface WalletShipping {
  fullName: string
  addressLine1: string
  addressLine2?: string
  city: string
  region?: string
  postalCode: string
  countryCode: string
}

export interface CaptureResult {
  redirectUrl: string | null
  message: string | null
}

export interface WalletContext {
  paypal: any
  clientId: string
  clientToken?: string | null
  env: "sandbox" | "live"
  locale: string
  currency: string
  allowedCountries: string[]
  messages: { shippingNotSupported: string; genericError: string; declined: string; cancelled: string }
  getTotal: () => string
  createOrder: (shipping: WalletShipping) => Promise<{ orderId: string }>
  captureOnServer: (orderId: string) => Promise<CaptureResult>
  appleContainer: HTMLElement | null
  googleContainer: HTMLElement | null
  onAppleAvailable: () => void
  onGoogleAvailable: () => void
  setProcessing: (v: boolean) => void
  setError: (msg: string | null) => void
  setNotice: (msg: string | null) => void
  isCancelled: () => boolean
  /** Optional diagnostic logger (shown on screen with ?pp_debug=1) */
  debug?: (msg: string) => void
}

export function describeError(err: unknown): string {
  if (!err) return "unknown"
  if (err instanceof Error) return `${err.name}: ${err.message}`
  try {
    return JSON.stringify(err).slice(0, 300)
  } catch {
    return String(err)
  }
}

const scriptPromises = new Map<string, Promise<void>>()

function loadScript(src: string): Promise<void> {
  if (scriptPromises.has(src)) return scriptPromises.get(src)!
  const p = new Promise<void>((resolve, reject) => {
    const el = document.createElement("script")
    el.src = src
    el.async = true
    el.onload = () => resolve()
    el.onerror = () => {
      scriptPromises.delete(src)
      reject(new Error(`Failed to load ${src}`))
    }
    document.head.appendChild(el)
  })
  scriptPromises.set(src, p)
  return p
}

function goTo(url: string) {
  window.location.assign(url)
}

export async function setupWallets(ctx: WalletContext) {
  const w = window as any
  const log = ctx.debug ?? (() => {})
  const hasApplePay = !!(w.ApplePaySession && w.ApplePaySession.canMakePayments?.())
  log(`device: ApplePaySession=${!!w.ApplePaySession} canMakePayments=${hasApplePay}`)

  // Separate SDK instance so a wallet problem can never break the PayPal / card buttons
  let sdk: any
  try {
    sdk = await ctx.paypal.createInstance({
      ...(ctx.clientToken ? { clientToken: ctx.clientToken } : { clientId: ctx.clientId }),
      components: ["applepay-payments", "googlepay-payments"],
      pageType: "checkout",
      locale: ctx.locale,
    })
    log("wallets: createInstance OK")
  } catch (err) {
    log(`wallets: createInstance FAILED → ${describeError(err)}`)
    throw err
  }
  if (ctx.isCancelled()) return

  let methods: any
  try {
    methods = await sdk.findEligibleMethods({ currencyCode: ctx.currency })
    log(
      `wallets: eligible applepay=${methods.isEligible("applepay")} googlepay=${methods.isEligible("googlepay")} (${ctx.currency})`,
    )
  } catch (err) {
    log(`wallets: findEligibleMethods FAILED → ${describeError(err)}`)
    throw err
  }
  if (ctx.isCancelled()) return

  if (hasApplePay && methods.isEligible("applepay") && ctx.appleContainer) {
    try {
      await setupApplePay(ctx, sdk, methods.getDetails("applepay"))
    } catch (err) {
      console.warn("[PayPal] Apple Pay not available:", err)
      log(`applepay: setup FAILED → ${describeError(err)}`)
    }
  }

  if (methods.isEligible("googlepay") && ctx.googleContainer) {
    try {
      await setupGooglePay(ctx, sdk, methods.getDetails("googlepay"))
    } catch (err) {
      console.warn("[PayPal] Google Pay not available:", err)
      log(`googlepay: setup FAILED → ${describeError(err)}`)
    }
  }
}

// ─── Apple Pay ───────────────────────────────────────────────────────────────
async function setupApplePay(ctx: WalletContext, sdk: any, details: any) {
  await loadScript(APPLE_PAY_SDK) // provides the <apple-pay-button> element
  if (ctx.isCancelled() || !ctx.appleContainer) return

  const w = window as any
  const paypalSession = sdk.createApplePayOneTimePaymentSession()
  const formatted = paypalSession.formatConfigForPaymentRequest(details.config)

  const button = document.createElement("apple-pay-button")
  button.setAttribute("buttonstyle", "black")
  button.setAttribute("type", "buy")
  button.setAttribute("locale", ctx.locale)
  button.style.setProperty("--apple-pay-button-width", "100%")
  button.style.setProperty("--apple-pay-button-height", "48px")
  button.style.setProperty("--apple-pay-button-border-radius", "6px")
  button.style.display = "block"
  button.style.width = "100%"

  button.addEventListener("click", () => {
    ctx.setError(null)
    ctx.setNotice(null)

    const total = { label: STORE_LABEL, amount: ctx.getTotal(), type: "final" }
    const paymentRequest = {
      ...formatted,
      countryCode: formatted.merchantCountry || "GB",
      currencyCode: ctx.currency,
      requiredBillingContactFields: ["postalAddress", "name"],
      requiredShippingContactFields: ["postalAddress", "name", "email", "phone"],
      total,
    }

    // Must be created synchronously inside the click (Apple requirement)
    const session = new w.ApplePaySession(4, paymentRequest)
    const countryError = () => [
      new w.ApplePayError("shippingContactInvalid", "countryCode", ctx.messages.shippingNotSupported),
    ]

    session.onvalidatemerchant = (event: any) => {
      paypalSession
        .validateMerchant({ validationUrl: event.validationURL })
        .then((payload: any) => session.completeMerchantValidation(payload.merchantSession))
        .catch((err: unknown) => {
          console.error("[PayPal] Apple Pay merchant validation failed:", err)
          session.abort()
          ctx.setError(ctx.messages.genericError)
        })
    }

    session.onpaymentmethodselected = () => {
      session.completePaymentMethodSelection({ newTotal: total })
    }

    session.onshippingcontactselected = (event: any) => {
      const country = String(event?.shippingContact?.countryCode || "").toUpperCase()
      if (!ctx.allowedCountries.includes(country)) {
        session.completeShippingContactSelection({ newTotal: total, errors: countryError() })
      } else {
        session.completeShippingContactSelection({ newTotal: total })
      }
    }

    session.onpaymentauthorized = async (event: any) => {
      const contact = event?.payment?.shippingContact || {}
      const lines: string[] = contact.addressLines || []
      const shipping: WalletShipping = {
        fullName: [contact.givenName, contact.familyName].filter(Boolean).join(" "),
        addressLine1: lines[0] || "",
        addressLine2: lines.slice(1).join(", ") || undefined,
        city: contact.locality || "",
        region: contact.administrativeArea || undefined,
        postalCode: contact.postalCode || "",
        countryCode: String(contact.countryCode || "").toUpperCase(),
      }

      if (!ctx.allowedCountries.includes(shipping.countryCode)) {
        session.completePayment({ status: w.ApplePaySession.STATUS_FAILURE, errors: countryError() })
        return
      }

      try {
        const { orderId } = await ctx.createOrder(shipping)
        await paypalSession.confirmOrder({
          orderId,
          token: event.payment.token,
          billingContact: event.payment.billingContact,
          shippingContact: event.payment.shippingContact,
        })
        const result = await ctx.captureOnServer(orderId)
        if (result.redirectUrl) {
          session.completePayment({ status: w.ApplePaySession.STATUS_SUCCESS })
          ctx.setProcessing(true)
          goTo(result.redirectUrl)
        } else {
          session.completePayment({ status: w.ApplePaySession.STATUS_FAILURE })
          ctx.setError(result.message || ctx.messages.genericError)
        }
      } catch (err) {
        console.error("[PayPal] Apple Pay payment failed:", err)
        session.completePayment({ status: w.ApplePaySession.STATUS_FAILURE })
        ctx.setError(ctx.messages.genericError)
      }
    }

    session.oncancel = () => ctx.setNotice(ctx.messages.cancelled)

    session.begin()
  })

  ctx.appleContainer.replaceChildren(button)
  ctx.debug?.("applepay: button shown")
  ctx.onAppleAvailable()
}

// ─── Google Pay ──────────────────────────────────────────────────────────────
async function setupGooglePay(ctx: WalletContext, sdk: any, details: any) {
  await loadScript(GOOGLE_PAY_SDK)
  if (ctx.isCancelled() || !ctx.googleContainer) return

  const gpay = (window as any).google?.payments?.api
  if (!gpay?.PaymentsClient) return

  const paypalSession = sdk.createGooglePayOneTimePaymentSession()
  const config = paypalSession.formatConfigForPaymentRequest(details.config)

  // Runs after the Google Pay sheet closes when the bank asks for 3-D Secure
  const finish3DS = async (orderId: string) => {
    ctx.setProcessing(true)
    try {
      await paypalSession.initiatePayerAction({ orderId })
      const result = await ctx.captureOnServer(orderId)
      if (result.redirectUrl) return goTo(result.redirectUrl)
      ctx.setError(result.message || ctx.messages.genericError)
    } catch (err) {
      console.error("[PayPal] Google Pay 3-D Secure failed:", err)
      ctx.setError(ctx.messages.declined)
    }
    ctx.setProcessing(false)
  }

  const onPaymentAuthorized = async (paymentData: any) => {
    const sa = paymentData?.shippingAddress || {}
    const shipping: WalletShipping = {
      fullName: sa.name || "",
      addressLine1: sa.address1 || "",
      addressLine2: [sa.address2, sa.address3].filter(Boolean).join(", ") || undefined,
      city: sa.locality || "",
      region: sa.administrativeArea || undefined,
      postalCode: sa.postalCode || "",
      countryCode: String(sa.countryCode || "").toUpperCase(),
    }
    const fail = (message: string, reason = "OTHER_ERROR") => ({
      transactionState: "ERROR",
      error: { intent: "PAYMENT_AUTHORIZATION", reason, message },
    })

    if (!ctx.allowedCountries.includes(shipping.countryCode)) {
      return fail(ctx.messages.shippingNotSupported, "SHIPPING_ADDRESS_UNSERVICEABLE")
    }

    try {
      const { orderId } = await ctx.createOrder(shipping)
      const { status } = await paypalSession.confirmOrder({
        orderId,
        paymentMethodData: paymentData.paymentMethodData,
        shippingAddress: paymentData.shippingAddress,
        email: paymentData.email,
      })

      if (status === "PAYER_ACTION_REQUIRED") {
        // 3-D Secure can only open after the Google sheet closes → close it, then authenticate
        setTimeout(() => void finish3DS(orderId), 0)
        return { transactionState: "SUCCESS" }
      }

      const result = await ctx.captureOnServer(orderId)
      if (result.redirectUrl) {
        ctx.setProcessing(true)
        setTimeout(() => goTo(result.redirectUrl!), 0)
        return { transactionState: "SUCCESS" }
      }
      return fail(result.message || ctx.messages.genericError)
    } catch (err) {
      console.error("[PayPal] Google Pay payment failed:", err)
      return fail(ctx.messages.genericError)
    }
  }

  const client = new gpay.PaymentsClient({
    environment: ctx.env === "live" ? "PRODUCTION" : "TEST",
    paymentDataCallbacks: { onPaymentAuthorized },
  })

  const ready = await client.isReadyToPay({
    apiVersion: config.apiVersion,
    apiVersionMinor: config.apiVersionMinor,
    allowedPaymentMethods: config.allowedPaymentMethods,
  })
  ctx.debug?.(`googlepay: isReadyToPay=${!!ready?.result}`)
  if (!ready?.result || ctx.isCancelled() || !ctx.googleContainer) return

  const onClick = () => {
    ctx.setError(null)
    ctx.setNotice(null)
    client
      .loadPaymentData({
        apiVersion: config.apiVersion,
        apiVersionMinor: config.apiVersionMinor,
        allowedPaymentMethods: config.allowedPaymentMethods,
        merchantInfo: config.merchantInfo,
        transactionInfo: {
          countryCode: config.countryCode,
          currencyCode: ctx.currency,
          totalPriceStatus: "FINAL",
          totalPrice: ctx.getTotal(),
          totalPriceLabel: "Total",
        },
        callbackIntents: ["PAYMENT_AUTHORIZATION"],
        emailRequired: true,
        shippingAddressRequired: true,
        shippingAddressParameters: { allowedCountryCodes: ctx.allowedCountries, phoneNumberRequired: false },
      })
      .catch((err: any) => {
        if (err?.statusCode === "CANCELED") ctx.setNotice(ctx.messages.cancelled)
        else console.error("[PayPal] Google Pay error:", err)
      })
  }

  const button = client.createButton({
    onClick,
    buttonColor: "black",
    buttonType: "buy",
    buttonSizeMode: "fill",
    buttonRadius: 6,
    buttonLocale: ctx.locale.slice(0, 2),
  })
  ctx.googleContainer.replaceChildren(button)
  ctx.debug?.("googlepay: button shown")
  ctx.onGoogleAvailable()
}
