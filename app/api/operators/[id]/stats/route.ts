import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(
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

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfYear = new Date(now.getFullYear(), 0, 1)

  const [
    totalAppointments,
    completedAppointments,
    totalRevenue,
    monthlyRevenue,
    yearlyRevenue,
    noShowCount,
    avgRating,
    recentAppointments,
  ] = await Promise.all([
    prisma.appointment.count({
      where: { operatorId: id },
    }),
    prisma.appointment.count({
      where: { operatorId: id, status: "COMPLETED" },
    }),
    prisma.appointment.aggregate({
      where: { operatorId: id, status: "COMPLETED" },
      _sum: { totalPrice: true },
    }),
    prisma.appointment.aggregate({
      where: {
        operatorId: id,
        status: "COMPLETED",
        date: { gte: startOfMonth },
      },
      _sum: { totalPrice: true },
    }),
    prisma.appointment.aggregate({
      where: {
        operatorId: id,
        status: "COMPLETED",
        date: { gte: startOfYear },
      },
      _sum: { totalPrice: true },
    }),
    prisma.appointment.count({
      where: { operatorId: id, noShow: true },
    }),
    prisma.review.aggregate({
      where: { operatorId: id, visible: true },
      _avg: { rating: true },
      _count: true,
    }),
    // Ultimi 30 giorni per trend
    prisma.appointment.groupBy({
      by: ["status"],
      where: {
        operatorId: id,
        date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      _count: true,
    }),
  ])

  const noShowRate =
    totalAppointments > 0
      ? ((noShowCount / totalAppointments) * 100).toFixed(1)
      : "0"

  const completionRate =
    totalAppointments > 0
      ? ((completedAppointments / totalAppointments) * 100).toFixed(1)
      : "0"

  return NextResponse.json({
    operatorId: id,
    totalAppointments,
    completedAppointments,
    revenue: {
      total: totalRevenue._sum.totalPrice || 0,
      monthly: monthlyRevenue._sum.totalPrice || 0,
      yearly: yearlyRevenue._sum.totalPrice || 0,
    },
    avgRating: avgRating._avg.rating || 0,
    reviewCount: avgRating._count,
    noShowCount,
    noShowRate: parseFloat(noShowRate),
    completionRate: parseFloat(completionRate),
    recentBreakdown: recentAppointments,
  })
}
