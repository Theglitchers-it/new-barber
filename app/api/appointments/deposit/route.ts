import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/api-utils"
import { stripe, isStripeEnabled } from "@/lib/stripe"

export async function POST(request: Request) {
  try {
    if (!isStripeEnabled() || !stripe) {
      return NextResponse.json({ error: "Pagamenti non configurati" }, { status: 503 })
    }

    const { session, error } = await requireAuth()
    if (error) return error

    const { appointmentId } = await request.json()
    if (!appointmentId) {
      return NextResponse.json({ error: "Appuntamento obbligatorio" }, { status: 400 })
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    })

    if (!appointment || appointment.userId !== session.user.id) {
      return NextResponse.json({ error: "Appuntamento non trovato" }, { status: 404 })
    }

    if (appointment.paymentStatus !== "UNPAID") {
      return NextResponse.json({ error: "Deposito già versato" }, { status: 400 })
    }

    const settings = await prisma.businessSettings.findFirst({ where: { id: "default" } })
    if (!settings?.depositRequired || !settings.depositAmount) {
      return NextResponse.json({ error: "Deposito non richiesto" }, { status: 400 })
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(settings.depositAmount * 100),
      currency: "eur",
      metadata: {
        appointmentId,
        userId: session.user.id,
        type: "deposit",
      },
    })

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { stripePaymentIntentId: paymentIntent.id },
    })

    return NextResponse.json({ clientSecret: paymentIntent.client_secret })
  } catch (error) {
    console.error("Errore deposito:", error)
    return NextResponse.json({ error: "Errore nel pagamento" }, { status: 500 })
  }
}
