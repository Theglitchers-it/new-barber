import { Resend } from "resend"

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const FROM_EMAIL = process.env.EMAIL_FROM || "SalonPro <noreply@salonpro.it>"

export function isEmailEnabled(): boolean {
  return !!resend
}

interface SendEmailParams {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<boolean> {
  if (!resend) {
    if (process.env.NODE_ENV === "development") {
      console.log(`[Email Dev] To: ${to} | Subject: ${subject}`)
    }
    return false
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    })

    if (error) {
      console.error("Errore invio email:", error)
      return false
    }
    return true
  } catch (error) {
    console.error("Errore invio email:", error)
    return false
  }
}
