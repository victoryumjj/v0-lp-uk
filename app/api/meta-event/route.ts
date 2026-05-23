import crypto from "crypto"
import { NextRequest, NextResponse } from "next/server"

const PIXEL_ID = "1200200552118123"
const ACCESS_TOKEN = process.env.FACEBOOK_TOKEN || process.env.META_ACCESS_TOKEN || ""

function sha256(value: string) {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex")
}

export async function POST(request: NextRequest) {
  try {
    const { event_name, event_id, email, phone, external_id, value, currency, fbp, fbc } = await request.json()

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("cf-connecting-ip")

    const user_agent = request.headers.get("user-agent")
    const event_source_url = request.headers.get("referer")

    const payload = {
      data: [
        {
          event_name: event_name || "Purchase",
          event_time: Math.floor(Date.now() / 1000),
          event_id: event_id || `${event_name || "Purchase"}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          action_source: "website",
          event_source_url,
          user_data: {
            em: email ? sha256(email) : undefined,
            ph: phone ? sha256(phone) : undefined,
            external_id: external_id ? sha256(external_id) : undefined,
            client_ip_address: ip,
            client_user_agent: user_agent,
            fbp,
            fbc,
          },
          custom_data: {
            value: value != null ? Number(value) : undefined,
            currency: currency || "GBP",
          },
        },
      ],
    }

    const resp = await fetch(
      `https://graph.facebook.com/v18.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    )

    const result = await resp.json()
    return NextResponse.json({ ok: true, meta: result })
  } catch (error) {
    console.error("Meta event tracking error:", error)
    return NextResponse.json({ error: "Failed to track event" }, { status: 500 })
  }
}
