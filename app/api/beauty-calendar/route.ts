import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { APPOINTMENT_STATUS } from "@/lib/constants"
import { z } from "zod"

const createReminderSchema = z.object({
  title: z.string().min(1, "Titolo obbligatorio").max(200),
  serviceId: z.string().optional(),
  suggestedDate: z.string().refine((d) => !isNaN(Date.parse(d)), "Data non valida"),
  intervalDays: z.number().int().min(1).max(365).optional().default(30),
})

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  const [reminders, appointments] = await Promise.all([
    prisma.beautyReminder.findMany({
      where: { userId: session.user.id, active: true },
      include: { service: { select: { name: true, duration: true } } },
      orderBy: { suggestedDate: "asc" },
      take: 50,
    }),
    prisma.appointment.findMany({
      where: {
        userId: session.user.id,
        date: { gte: new Date() },
        status: { in: [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.CONFIRMED] },
      },
      include: {
        service: { select: { name: true } },
        operator: { select: { name: true } },
      },
      orderBy: { date: "asc" },
      take: 20,
    }),
  ])

  return NextResponse.json({ reminders, appointments })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  let body
  try { body = await request.json() } catch {
    return NextResponse.json({ error: "JSON non valido" }, { status: 400 })
  }

  const parsed = createReminderSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const { title, serviceId, suggestedDate, intervalDays } = parsed.data

  const reminder = await prisma.beautyReminder.create({
    data: {
      userId: session.user.id,
      title,
      serviceId: serviceId || null,
      suggestedDate: new Date(suggestedDate),
      intervalDays,
    },
  })

  return NextResponse.json(reminder, { status: 201 })
}
