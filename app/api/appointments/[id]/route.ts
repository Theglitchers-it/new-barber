import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { updateAppointmentSchema, rescheduleAppointmentSchema } from "@/lib/validations/appointment"
import { awardLoyaltyPoints } from "@/lib/loyalty"
import { APPOINTMENT_STATUS, USER_ROLE, NOTIFICATION_TYPE } from "@/lib/constants"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  const { id } = await params
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      service: true,
      operator: true,
      user: { select: { id: true, name: true } },
      review: { select: { id: true, rating: true, comment: true } },
    },
  })

  if (!appointment) {
    return NextResponse.json({ error: "Appuntamento non trovato" }, { status: 404 })
  }

  if (session.user.role !== USER_ROLE.ADMIN && appointment.userId !== session.user.id) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 })
  }

  return NextResponse.json(appointment)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()

  // Try reschedule schema first (admin only)
  const reschedule = rescheduleAppointmentSchema.safeParse(body)
  if (reschedule.success) {
    if (session.user.role !== USER_ROLE.ADMIN) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 403 })
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { service: { select: { name: true, duration: true } } },
    })
    if (!appointment) {
      return NextResponse.json({ error: "Appuntamento non trovato" }, { status: 404 })
    }

    if (appointment.status === APPOINTMENT_STATUS.COMPLETED || appointment.status === APPOINTMENT_STATUS.CANCELLED) {
      return NextResponse.json({ error: "Non è possibile riprogrammare un appuntamento completato o cancellato" }, { status: 400 })
    }

    const newDate = new Date(reschedule.data.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (newDate < today) {
      return NextResponse.json({ error: "Non è possibile riprogrammare nel passato" }, { status: 400 })
    }

    const newOperatorId = reschedule.data.operatorId || appointment.operatorId
    const [hours, minutes] = reschedule.data.startTime.split(":").map(Number)
    const startMinutes = hours * 60 + minutes
    const endMinutes = startMinutes + appointment.service.duration
    const newEndTime = `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`

    // Check conflicts
    const conflict = await prisma.appointment.findFirst({
      where: {
        id: { not: id },
        operatorId: newOperatorId,
        date: newDate,
        status: { not: APPOINTMENT_STATUS.CANCELLED },
        OR: [
          { startTime: { lt: newEndTime }, endTime: { gt: reschedule.data.startTime } },
        ],
      },
    })

    if (conflict) {
      return NextResponse.json({ error: "Lo slot selezionato non è disponibile" }, { status: 409 })
    }

    const [updated] = await Promise.all([
      prisma.appointment.update({
        where: { id },
        data: {
          date: newDate,
          startTime: reschedule.data.startTime,
          endTime: newEndTime,
          operatorId: newOperatorId,
        },
        include: { service: true, operator: true },
      }),
      prisma.notification.create({
        data: {
          userId: appointment.userId,
          title: "Appuntamento riprogrammato",
          message: `Il tuo appuntamento per ${appointment.service.name} è stato spostato al ${newDate.toLocaleDateString("it-IT", { day: "numeric", month: "long" })} alle ${reschedule.data.startTime}`,
          type: NOTIFICATION_TYPE.APPOINTMENT,
          link: `/prenotazioni/${id}`,
        },
      }),
    ])

    return NextResponse.json(updated)
  }

  // Status update
  const parsed = updateAppointmentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: { service: { select: { name: true } } },
  })
  if (!appointment) {
    return NextResponse.json({ error: "Appuntamento non trovato" }, { status: 404 })
  }

  if (session.user.role !== USER_ROLE.ADMIN && appointment.userId !== session.user.id) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 })
  }

  if (session.user.role !== USER_ROLE.ADMIN && parsed.data.status !== APPOINTMENT_STATUS.CANCELLED) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 })
  }

  if (parsed.data.status === APPOINTMENT_STATUS.COMPLETED && appointment.status !== APPOINTMENT_STATUS.COMPLETED) {
    await awardLoyaltyPoints({
      userId: appointment.userId,
      amount: appointment.totalPrice,
      reason: `Appuntamento completato - ${appointment.service.name}`,
      appointmentId: id,
    })
  }

  const updated = await prisma.appointment.update({
    where: { id },
    data: {
      status: parsed.data.status,
      ...(parsed.data.noShow !== undefined && { noShow: parsed.data.noShow }),
    },
    include: { service: true, operator: true },
  })

  return NextResponse.json(updated)
}
