import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/api-utils"
import { stripe, isStripeEnabled } from "@/lib/stripe"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!isStripeEnabled() || !stripe) {
      return NextResponse.json({ error: "Pagamenti non configurati" }, { status: 503 })
    }

    const { error } = await requireAdmin()
    if (error) return error

    const { id } = await params

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { service: { select: { name: true } }, operator: { select: { name: true } } },
    })

    if (!appointment) {
      return NextResponse.json({ error: "Appuntamento non trovato" }, { status: 404 })
    }

    if (appointment.status !== "COMPLETED") {
      return NextResponse.json({ error: "Appuntamento non completato" }, { status: 400 })
    }

    if (appointment.paymentStatus === "PAID") {
      return NextResponse.json({ error: "Già pagato" }, { status: 400 })
    }

    const depositPaid = appointment.deposit || 0
    const remaining = appointment.totalPrice - depositPaid
    if (remaining <= 0) {
      return NextResponse.json({ error: "Nessun saldo da incassare" }, { status: 400 })
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(remaining * 100),
      currency: "eur",
      metadata: {
        appointmentId: id,
        userId: appointment.userId,
        type: "charge",
      },
      description: `${appointment.service.name} con ${appointment.operator.name}`,
    })

    return NextResponse.json({ clientSecret: paymentIntent.client_secret, amount: remaining })
  } catch (error) {
    console.error("Errore incasso:", error)
    return NextResponse.json({ error: "Errore nel pagamento" }, { status: 500 })
  }
}
