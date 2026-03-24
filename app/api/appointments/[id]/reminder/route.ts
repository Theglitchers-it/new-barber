import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { USER_ROLE, NOTIFICATION_TYPE } from "@/lib/constants"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || session.user.role !== USER_ROLE.ADMIN) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 })
  }

  const { id } = await params
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: { service: { select: { name: true } } },
  })

  if (!appointment) {
    return NextResponse.json({ error: "Appuntamento non trovato" }, { status: 404 })
  }

  const [updated] = await Promise.all([
    prisma.appointment.update({
      where: { id },
      data: { reminderSent: true },
    }),
    prisma.notification.create({
      data: {
        userId: appointment.userId,
        title: "Promemoria appuntamento",
        message: `Ricordati del tuo appuntamento per ${appointment.service.name} il ${new Date(appointment.date).toLocaleDateString("it-IT", { day: "numeric", month: "long" })} alle ${appointment.startTime}`,
        type: NOTIFICATION_TYPE.APPOINTMENT,
        link: `/prenotazioni/${id}`,
      },
    }),
  ])

  return NextResponse.json({ success: true, reminderSent: updated.reminderSent })
}
