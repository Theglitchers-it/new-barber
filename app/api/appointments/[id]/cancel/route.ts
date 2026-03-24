import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { checkWaitlist } from "@/lib/waitlist"
import { NOTIFICATION_TYPE, APPOINTMENT_STATUS } from "@/lib/constants"
import { cancelLimiter, getRateLimitResponse } from "@/lib/rate-limit"
import { cancelAppointmentSchema } from "@/lib/validations/api"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  const { success } = cancelLimiter.check(5, session.user.id)
  if (!success) return getRateLimitResponse()

  const { id } = await params
  const body = await request.json()
  const parsed = cancelAppointmentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }
  const reason = parsed.data.reason

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: { service: true },
  })

  if (!appointment) {
    return NextResponse.json({ error: "Appuntamento non trovato" }, { status: 404 })
  }

  if (session.user.role !== "ADMIN" && appointment.userId !== session.user.id) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 })
  }

  if (appointment.status === APPOINTMENT_STATUS.CANCELLED) {
    return NextResponse.json({ error: "Appuntamento già cancellato" }, { status: 400 })
  }

  if (appointment.status === APPOINTMENT_STATUS.COMPLETED) {
    return NextResponse.json({ error: "Non è possibile cancellare un appuntamento completato" }, { status: 400 })
  }

  const updated = await prisma.appointment.update({
    where: { id },
    data: {
      status: APPOINTMENT_STATUS.CANCELLED,
      cancellationReason: reason,
      cancelledAt: new Date(),
    },
    include: { service: true, operator: true },
  })

  await Promise.all([
    prisma.notification.create({
      data: {
        userId: appointment.userId,
        title: "Appuntamento cancellato",
        message: `Il tuo appuntamento per ${appointment.service.name} è stato cancellato. Motivo: ${reason}`,
        type: NOTIFICATION_TYPE.APPOINTMENT,
        link: `/prenotazioni/${id}`,
      },
    }),
    checkWaitlist(appointment.date, appointment.serviceId),
  ])

  return NextResponse.json(updated)
}
