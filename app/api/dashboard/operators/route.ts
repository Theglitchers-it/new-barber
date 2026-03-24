import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 })
  }

  const operators = await prisma.operator.findMany({
    where: { active: true },
    select: {
      id: true,
      name: true,
      role: true,
      image: true,
      rating: true,
      reviewCount: true,
    },
    orderBy: { name: "asc" },
  })

  const operatorData = await Promise.all(
    operators.map(async (op) => {
      const [appointmentCount, revenue, noShowCount] = await Promise.all([
        prisma.appointment.count({
          where: { operatorId: op.id, status: { not: "CANCELLED" } },
        }),
        prisma.appointment.aggregate({
          where: { operatorId: op.id, status: "COMPLETED" },
          _sum: { totalPrice: true },
        }),
        prisma.appointment.count({
          where: { operatorId: op.id, noShow: true },
        }),
      ])

      const totalForRate = appointmentCount + noShowCount
      return {
        id: op.id,
        name: op.name,
        role: op.role,
        image: op.image,
        appointments: appointmentCount,
        revenue: revenue._sum.totalPrice || 0,
        rating: op.rating,
        reviewCount: op.reviewCount,
        noShowRate: totalForRate > 0 ? Math.round((noShowCount / totalForRate) * 100) : 0,
      }
    })
  )

  return NextResponse.json(operatorData)
}
