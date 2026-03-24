import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { createAppointmentSchema } from "@/lib/validations/appointment"
import { appointmentLimiter, getRateLimitResponse } from "@/lib/rate-limit"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  const where = session.user.role === "ADMIN" ? {} : { userId: session.user.id }

  const appointments = await prisma.appointment.findMany({
    where,
    include: {
      service: true,
      operator: true,
      user: { select: { id: true, name: true } },
    },
    orderBy: { date: "desc" },
  })

  return NextResponse.json(appointments)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  const { success } = appointmentLimiter.check(10, session.user.id)
  if (!success) return getRateLimitResponse()

  const body = await request.json()
  const parsed = createAppointmentSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const { serviceId, operatorId, date, startTime } = parsed.data

  // Reject past dates
  const appointmentDate = new Date(date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (appointmentDate < today) {
    return NextResponse.json({ error: "Non è possibile prenotare nel passato" }, { status: 400 })
  }

  const service = await prisma.service.findUnique({ where: { id: serviceId } })
  if (!service) {
    return NextResponse.json({ error: "Servizio non trovato" }, { status: 404 })
  }

  // Calcola endTime basato sulla durata del servizio
  const [hours, minutes] = startTime.split(":").map(Number)
  const startMinutes = hours * 60 + minutes
  const endMinutes = startMinutes + service.duration
  const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`

  // Verifica conflitti + creazione in transazione per evitare race condition
  try {
    const appointment = await prisma.$transaction(async (tx) => {
      const conflict = await tx.appointment.findFirst({
        where: {
          operatorId,
          date: new Date(date),
          status: { not: "CANCELLED" },
          OR: [
            { startTime: { lt: endTime }, endTime: { gt: startTime } },
          ],
        },
      })

      if (conflict) {
        throw new Error("CONFLICT")
      }

      return tx.appointment.create({
        data: {
          userId: session.user.id,
          serviceId,
          operatorId,
          date: new Date(date),
          startTime,
          endTime,
          totalPrice: service.price,
          status: "CONFIRMED",
        },
        include: {
          service: true,
          operator: true,
        },
      })
    })

    return NextResponse.json(appointment, { status: 201 })
  } catch (err) {
    if (err instanceof Error && err.message === "CONFLICT") {
      return NextResponse.json({ error: "Questo slot non è più disponibile" }, { status: 409 })
    }
    console.error("Appointment creation error:", err)
    return NextResponse.json({ error: "Errore nella creazione dell'appuntamento" }, { status: 500 })
  }
}
