import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { operatorSchema } from "@/lib/validations/settings"
import { APPOINTMENT_STATUS, USER_ROLE } from "@/lib/constants"

export async function GET() {
  const session = await auth()
  if (!session?.user || session.user.role !== USER_ROLE.ADMIN) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 })
  }

  const [operators, completedCounts, revenues, noShowCounts] = await Promise.all([
    prisma.operator.findMany({
      where: { active: true },
      include: {
        availabilities: true,
        _count: { select: { appointments: true, reviews: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.appointment.groupBy({
      by: ["operatorId"],
      where: { status: APPOINTMENT_STATUS.COMPLETED },
      _count: true,
    }),
    prisma.appointment.groupBy({
      by: ["operatorId"],
      where: { status: APPOINTMENT_STATUS.COMPLETED },
      _sum: { totalPrice: true },
    }),
    prisma.appointment.groupBy({
      by: ["operatorId"],
      where: { noShow: true },
      _count: true,
    }),
  ])

  const completedMap = new Map(completedCounts.map((r) => [r.operatorId, r._count]))
  const revenueMap = new Map(revenues.map((r) => [r.operatorId, r._sum.totalPrice || 0]))
  const noShowMap = new Map(noShowCounts.map((r) => [r.operatorId, r._count]))

  const operatorsWithStats = operators.map((op) => ({
    ...op,
    stats: {
      totalAppointments: op._count.appointments,
      completedAppointments: completedMap.get(op.id) || 0,
      revenue: revenueMap.get(op.id) || 0,
      noShowCount: noShowMap.get(op.id) || 0,
    },
  }))

  return NextResponse.json(operatorsWithStats, {
    headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=120" },
  })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 })
  }

  const body = await request.json()
  const parsed = operatorSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    )
  }

  const operator = await prisma.operator.create({
    data: {
      name: parsed.data.name,
      role: parsed.data.role,
      specializations: parsed.data.specializations || null,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      bio: parsed.data.bio || null,
      commission: parsed.data.commission ?? null,
      image: parsed.data.image || null,
      hireDate: new Date(),
    },
    include: { availabilities: true },
  })

  return NextResponse.json(operator, { status: 201 })
}
