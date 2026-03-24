import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { operatorUpdateSchema } from "@/lib/validations/settings"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  const { id } = await params
  const operator = await prisma.operator.findUnique({
    where: { id },
    include: {
      availabilities: {
        orderBy: { dayOfWeek: "asc" },
      },
      reviews: {
        where: { visible: true },
        include: {
          user: { select: { name: true, image: true } },
          appointment: { include: { service: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      appointments: {
        include: {
          service: true,
          user: { select: { id: true, name: true } },
        },
        orderBy: { date: "desc" },
        take: 20,
      },
      _count: {
        select: { appointments: true, reviews: true },
      },
    },
  })

  if (!operator) {
    return NextResponse.json({ error: "Operatore non trovato" }, { status: 404 })
  }

  // Calcola statistiche
  const [completedCount, revenue, noShowCount] = await Promise.all([
    prisma.appointment.count({
      where: { operatorId: id, status: "COMPLETED" },
    }),
    prisma.appointment.aggregate({
      where: { operatorId: id, status: "COMPLETED" },
      _sum: { totalPrice: true },
    }),
    prisma.appointment.count({
      where: { operatorId: id, noShow: true },
    }),
  ])

  // Non-admin: restituisci solo dati pubblici (niente email, phone, commission, appointments)
  if (session.user.role !== "ADMIN") {
    const { appointments, email, phone, commission, ...publicOperator } = operator
    return NextResponse.json({
      ...publicOperator,
      stats: {
        totalAppointments: operator._count.appointments,
        completedAppointments: completedCount,
      },
    })
  }

  return NextResponse.json({
    ...operator,
    stats: {
      totalAppointments: operator._count.appointments,
      completedAppointments: completedCount,
      revenue: revenue._sum.totalPrice || 0,
      noShowCount,
      noShowRate:
        operator._count.appointments > 0
          ? ((noShowCount / operator._count.appointments) * 100).toFixed(1)
          : "0",
    },
  })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()
  const parsed = operatorUpdateSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    )
  }

  const operator = await prisma.operator.findUnique({ where: { id } })
  if (!operator) {
    return NextResponse.json({ error: "Operatore non trovato" }, { status: 404 })
  }

  const updated = await prisma.operator.update({
    where: { id },
    data: {
      ...parsed.data,
      email: parsed.data.email || null,
    },
    include: { availabilities: true },
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 })
  }

  const { id } = await params
  const operator = await prisma.operator.findUnique({ where: { id } })
  if (!operator) {
    return NextResponse.json({ error: "Operatore non trovato" }, { status: 404 })
  }

  // Disattiva invece di eliminare
  const deactivated = await prisma.operator.update({
    where: { id },
    data: { active: false },
  })

  return NextResponse.json(deactivated)
}
