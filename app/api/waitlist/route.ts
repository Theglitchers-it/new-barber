import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { WAITLIST_STATUS } from "@/lib/constants"
import { waitlistCreateSchema } from "@/lib/validations/api"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  const entries = await prisma.waitlistEntry.findMany({
    where: {
      userId: session.user.id,
      status: { in: [WAITLIST_STATUS.WAITING, WAITLIST_STATUS.NOTIFIED] },
    },
    include: {
      service: { select: { name: true, duration: true, price: true } },
    },
    orderBy: { date: "asc" },
  })

  return NextResponse.json(entries)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  const body = await request.json()
  const parsed = waitlistCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }
  const { serviceId, date, operatorId, startTime } = parsed.data

  const [service, existing] = await Promise.all([
    prisma.service.findUnique({ where: { id: serviceId } }),
    prisma.waitlistEntry.findFirst({
      where: { userId: session.user.id, serviceId, date: new Date(date), status: WAITLIST_STATUS.WAITING },
    }),
  ])

  if (!service) {
    return NextResponse.json({ error: "Servizio non trovato" }, { status: 404 })
  }
  if (existing) {
    return NextResponse.json({ error: "Sei già in lista d'attesa per questa data" }, { status: 409 })
  }

  const entry = await prisma.waitlistEntry.create({
    data: {
      userId: session.user.id,
      serviceId,
      date: new Date(date),
      operatorId: operatorId || null,
      startTime: startTime || null,
    },
    include: {
      service: { select: { name: true, duration: true, price: true } },
    },
  })

  return NextResponse.json(entry, { status: 201 })
}
