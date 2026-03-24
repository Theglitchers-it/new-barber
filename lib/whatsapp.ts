import { createHmac, timingSafeEqual } from "crypto"

const WHATSAPP_API_URL = "https://graph.facebook.com/v21.0"

/**
 * Verify the X-Hub-Signature-256 header from Meta's webhook.
 * Returns true if the signature is valid, false otherwise.
 */
export function verifyWebhookSignature(
  rawBody: string | Buffer,
  signatureHeader: string | null
): boolean {
  const appSecret = process.env.WHATSAPP_APP_SECRET
  if (!appSecret) {
    console.warn("[WhatsApp] WHATSAPP_APP_SECRET non configurato — firma non verificabile")
    return false
  }

  if (!signatureHeader) {
    return false
  }

  const expectedSignature = createHmac("sha256", appSecret)
    .update(rawBody)
    .digest("hex")

  const providedSignature = signatureHeader.replace("sha256=", "")

  if (expectedSignature.length !== providedSignature.length) {
    return false
  }

  return timingSafeEqual(
    Buffer.from(expectedSignature, "hex"),
    Buffer.from(providedSignature, "hex")
  )
}

class WhatsAppClient {
  private token: string | undefined
  private phoneNumberId: string | undefined
  private isDev: boolean

  constructor() {
    this.token = process.env.WHATSAPP_API_TOKEN
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
    this.isDev = !this.token || !this.phoneNumberId
  }

  private refreshConfig() {
    this.token = process.env.WHATSAPP_API_TOKEN
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
    this.isDev = !this.token || !this.phoneNumberId
  }

  get isConfigured(): boolean {
    this.refreshConfig()
    return !this.isDev
  }

  async sendMessage(phone: string, text: string): Promise<boolean> {
    this.refreshConfig()

    if (this.isDev) {
      console.log(`[WhatsApp DEV] To: ${phone}`)
      console.log(`[WhatsApp DEV] Message: ${text}`)
      return true
    }

    try {
      const response = await fetch(
        `${WHATSAPP_API_URL}/${this.phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: phone,
            type: "text",
            text: { body: text },
          }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        console.error("[WhatsApp] Errore invio messaggio:", error)
        return false
      }

      return true
    } catch (error) {
      console.error("[WhatsApp] Errore di rete:", error)
      return false
    }
  }

  async sendTemplateMessage(
    phone: string,
    template: string,
    params: string[]
  ): Promise<boolean> {
    this.refreshConfig()

    if (this.isDev) {
      console.log(`[WhatsApp DEV] To: ${phone}`)
      console.log(`[WhatsApp DEV] Template: ${template}, Params: ${params.join(", ")}`)
      return true
    }

    try {
      const components =
        params.length > 0
          ? [
              {
                type: "body",
                parameters: params.map((p) => ({
                  type: "text",
                  text: p,
                })),
              },
            ]
          : []

      const response = await fetch(
        `${WHATSAPP_API_URL}/${this.phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: phone,
            type: "template",
            template: {
              name: template,
              language: { code: "it" },
              components,
            },
          }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        console.error("[WhatsApp] Errore invio template:", error)
        return false
      }

      return true
    } catch (error) {
      console.error("[WhatsApp] Errore di rete:", error)
      return false
    }
  }
}

export const whatsapp = new WhatsAppClient()
