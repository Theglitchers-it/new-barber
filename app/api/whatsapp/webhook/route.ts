import { NextRequest, NextResponse } from "next/server"
import { processMessage } from "@/lib/whatsapp-bot"
import { whatsapp, verifyWebhookSignature } from "@/lib/whatsapp"

// GET: WhatsApp webhook verification
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams

  const mode = searchParams.get("hub.mode")
  const token = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log("[WhatsApp Webhook] Verifica completata")
    return new NextResponse(challenge, { status: 200 })
  }

  console.warn("[WhatsApp Webhook] Verifica fallita - token non valido")
  return NextResponse.json({ error: "Token di verifica non valido" }, { status: 403 })
}

// POST: Receive incoming messages
export async function POST(request: NextRequest) {
  try {
    // Read raw body for signature verification
    const rawBody = await request.text()

    // Verify X-Hub-Signature-256 from Meta
    const signature = request.headers.get("x-hub-signature-256")
    if (!verifyWebhookSignature(rawBody, signature)) {
      console.warn("[WhatsApp Webhook] Firma non valida — richiesta rifiutata")
      return NextResponse.json({ error: "Firma non valida" }, { status: 403 })
    }

    const body = JSON.parse(rawBody)

    // WhatsApp sends a specific payload structure
    const entry = body?.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value

    // Check if this is a message (not a status update)
    if (!value?.messages || value.messages.length === 0) {
      // Status update or other non-message event — acknowledge
      return NextResponse.json({ status: "ok" })
    }

    const message = value.messages[0]
    const senderPhone = message.from // e.g. "393331234567"
    const messageText = message.text?.body

    if (!senderPhone || !messageText) {
      return NextResponse.json({ status: "ok" })
    }

    console.log(`[WhatsApp] Messaggio da ${senderPhone}: ${messageText}`)

    // Process the message through the bot
    const reply = await processMessage(senderPhone, messageText)

    // Send the reply
    await whatsapp.sendMessage(senderPhone, reply)

    return NextResponse.json({ status: "ok" })
  } catch (error) {
    console.error("[WhatsApp Webhook] Errore:", error)
    // Always return 200 to WhatsApp to avoid retries
    return NextResponse.json({ status: "error" }, { status: 200 })
  }
}
