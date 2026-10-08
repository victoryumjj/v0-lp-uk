# Pagou Integration

This project integrates with the Pagou.ai API for payments, subscriptions, transfers, and webhooks.

## API

- Sandbox: https://api.sandbox.pagou.ai
- Production: https://api.pagou.ai
- Fast docs: https://developer.pagou.ai/llms.txt
- Full docs: https://developer.pagou.ai/llms-full.txt
- OpenAPI v2: https://developer.pagou.ai/api-reference/openapi-v2.json

## Authentication

Pick one method:
- `Authorization: Bearer <PAGOU_API_KEY>`
- `apiKey: <PAGOU_API_KEY>` header
- Basic Auth (username=token, password=x)

Keep secret keys server-side only. Use environment variables. Never expose a Pagou secret key in the browser.

## Core rules

- Validate endpoints, fields, statuses, and webhook shapes against OpenAPI before coding
- Do not invent undocumented endpoints, fields, statuses, or flows
- Amounts in API v2 are in cents
- Always include `external_ref` and idempotency on writes
- Use Payment Element / SDK v3 for cards; send only `pgct_` tokens to the backend
- Implement real webhooks, deduplicate by top-level event id, and process asynchronously
- Use GET polling only for reconciliation, support, or recovery, never as the primary flow

## Payments

### Create Pix payment
```
POST /v2/transactions
{
  "external_ref": "order_1001",
  "amount": 1500,
  "currency": "BRL",
  "method": "pix",
  "buyer": {
    "name": "Customer Name",
    "email": "customer@example.com",
    "document": { "type": "CPF", "number": "12345678901" }
  }
}
```

Response includes `pix_qr_code` (base64) and `pix_code` (string).

### Create card payment
```
POST /v2/transactions
{
  "external_ref": "order_1001",
  "amount": 2490,
  "currency": "BRL",
  "method": "credit_card",
  "token": "<token_from_payment_element>",
  "installments": 1
}
```

Card payments require Payment Element in browser to tokenize card data.

### Transaction statuses
pending → paid | expired | canceled | refused | refunded | partially_refunded | chargedback

## Subscriptions

Create a card subscription from the backend after the browser returns a Payment Element token:

```
POST /v2/subscriptions
{
  "customer_id": "018f1f2e-7b46-7c9a-8d3e-1a2b3c4d5e73",
  "token": "pgct_...",
  "amount": 4990,
  "currency": "BRL",
  "interval": "month",
  "interval_count": 1,
  "external_ref": "sub_1001"
}
```

Use subscription webhooks to grant, renew, pause, or remove access. Reconcile uncertain state with `GET /v2/subscriptions/{id}`.

For Pix Automático, send `payment_method: "pix_automatic"` and no `token`. The subscription starts as `incomplete`; show `authorization.qr_code` to the payer. Its charges arrive only as `subscription.*` webhooks, cancellation is immediate and emits `subscription.canceled`, and plan changes return `422`. Guide: https://developer.pagou.ai/subscriptions/pix-automatic

### Subscription statuses
incomplete → trialing → active | past_due | cancel_scheduled (card only) | canceled

## Transfers (Pix Out)

```
POST /v2/transfers
{
  "pix_key_type": "EMAIL",
  "pix_key_value": "recipient@example.com",
  "amount": 1200,
  "description": "Payout description",
  "external_ref": "payout_1001"
}
```

pix_key_type: CPF, CNPJ, EMAIL, PHONE, EVP

### Transfer statuses
pending → in_analysis → processing → paid | error | cancelled

## Webhooks

### Payment event structure
```json
{
  "id": "evt_pay_1001",
  "event": "transaction",
  "data": {
    "event_type": "transaction.paid",
    "id": "018f1f2e-7b42-7c9a-8d3e-1a2b3c4d5e6f",
    "status": "paid",
    "correlation_id": "order_1001"
  }
}
```

### Transfer event structure
```json
{
  "id": "evt_payout_1001",
  "type": "payout.transferred",
  "data": {
    "object": {
      "id": "018f1f2e-7b45-7c9a-8d3e-1a2b3c4d5e72",
      "status": "paid"
    }
  }
}
```

### Subscription event structure
```json
{
  "id": "evt_sub_1001",
  "event": "subscription",
  "data": {
    "event_type": "subscription.created",
    "id": "018f1f2e-7b47-7c9a-8d3e-1a2b3c4d5e74",
    "status": "active",
    "customer_email": "customer@example.com"
  }
}
```

### Payment events
- transaction.created
- transaction.pending
- transaction.paid
- transaction.cancelled
- transaction.refunded
- transaction.chargedback
- transaction.three_ds_required

### Subscription events
- subscription.created
- subscription.started
- subscription.renewed
- subscription.updated
- subscription.canceled
- subscription.payment_failed
- subscription.past_due
- subscription.trial_will_end
- subscription.chargeback_received

### Transfer events
- payout.created
- payout.in_analysis
- payout.processing
- payout.transferred
- payout.failed
- payout.canceled

## TypeScript SDK

```bash
bun add @pagouai/api-sdk
```

```ts
import { Client } from "@pagouai/api-sdk";

const client = new Client({
  apiKey: process.env.PAGOU_API_KEY!,
  environment: "sandbox",
});

// Pix payment
const tx = await client.transactions.create({
  external_ref: "order_1001",
  amount: 1500,
  currency: "BRL",
  method: "pix",
});

// Transfer
const transfer = await client.transfers.create({
  pix_key_type: "EMAIL",
  pix_key_value: "recipient@example.com",
  amount: 1200,
  external_ref: "payout_1001",
});
```

## Rules

- Always include `external_ref` for correlation and idempotency
- Use `requestId` for request tracing when the API returns it
- Deduplicate webhooks by top-level event id, not transaction, subscription, or transfer id
- Route payments by `event="transaction"` + `data.event_type`
- Route subscriptions by `event="subscription"` + `data.event_type`
- Route transfers by top-level `type`
- Reconcile uncertain states with GET; do not use polling as the main integration flow
- Cards require Payment Element; never handle raw card data
- ACK webhooks quickly with `{ "received": true }`

## Common mistakes to avoid

- Retrying POST on failure (use GET to reconcile instead)
- Deduplicating webhooks by resource id (same resource emits multiple events)
- Skipping external_ref (makes reconciliation impossible)
- Handling raw card numbers (use Payment Element tokens)
- Ignoring next_action for 3DS flows
- Updating order, access, or payout state from browser success instead of webhook-confirmed or server-reconciled state

---

## This project (slaturadecori.com) — project-specific context

Store: Slatura Wood, physical goods (flexible acoustic wall panels), Next.js App Router on Vercel.
Markets: UK (GBP, delivery to United Kingdom only) and FR (EUR).

### Flow used: Checkout Links (Pagou-hosted checkout)
- Endpoint: `POST /v2/checkout-links` — validated against OpenAPI v2.
- Why: the transactions API (`POST /v2/transactions`) does not accept GBP/EUR; checkout links do.
- Body: `{ title, currency, products: [{ external_id, name, price (cents), quantity, currency, type: "physical" }] }`.
- Prices come ONLY from the server catalog `lib/checkout/catalog.ts`; any tampered browser price is rejected.
- Response `data.url` → the browser is redirected there. Cards are entered only on Pagou's page (no raw card data here).
- `external_ref`: NOT available on checkout links in the OpenAPI (exists only on transactions, refunds, transfers).
  Creating a checkout link does not move money, so no idempotency field is sent. Do not add undocumented fields.
- Not documented for checkout links: return URL and shipping-country restriction → configure in the Pagou dashboard.

### Webhook
- URL: `https://www.slaturadecori.com/api/pagou/webhook` (`app/api/pagou/webhook/route.ts`).
- Signature: HMAC-SHA256 of `{timestamp}.{rawBody}` with the Security Token (`X-Pagou-Signature`, `X-Pagou-Timestamp`).
- ACK `{ "received": true }` immediately; processing runs after the response (`after()`).
- Dedupe by top-level event `id` (best effort per instance — this project has no database).
- `transaction.paid` (signed) = paid. `GET /v2/transactions/{id}` only to reconcile an incomplete event.
- On paid: Meta Purchase via Conversions API, `event_id = purchase_<transactionId>` (server only).
  The success page (`/success-uk`, `/succes-fr`) never marks an order as paid and never fires Purchase.

### Files
- `lib/pagou/client.ts` — API client (server-only), webhook signature check
- `app/api/pagou/checkout/route.ts` — creates the checkout link
- `app/api/pagou/webhook/route.ts` — webhook
- `components/pagou-checkout*.tsx` — "Confirm My Order" button (UK/FR)
- `lib/checkout/catalog.ts` — server price catalog (source of truth)

### Environment variables (Vercel only, never in code)
- `PAGOU_ENV` — `sandbox` | `production`
- `PAGOU_API_KEY` — secret API key
- `PAGOU_WEBHOOK_SECRET` — webhook Security Token
- `META_ACCESS_TOKEN_UK2` / `META_ACCESS_TOKEN` — Meta Conversions API

### Testing
- Sandbox first (`PAGOU_ENV=sandbox`), test data: https://developer.pagou.ai/start-here/test-data
- Never test in production with the owner's own card.
