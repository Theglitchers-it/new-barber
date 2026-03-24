import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  const userId = session.user.id
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [
    user,
    totalAppointments,
    nextAppointment,
    recentAppointments,
    recentOrders,
    recentTransactions,
    reviews,
    topServiceGroup,
    topOperatorGroup,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        phone: true,
        hairType: true,
        avatar: true,
        loyaltyPoints: true,
        totalSpent: true,
        createdAt: true,
      },
    }),
    prisma.appointment.count({
      where: { userId, status: "COMPLETED" },
    }),
    prisma.appointment.findFirst({
      where: {
        userId,
        date: { gte: today },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      orderBy: { date: "asc" },
      include: {
        service: { select: { name: true, duration: true } },
        operator: { select: { name: true } },
      },
    }),
    prisma.appointment.findMany({
      where: { userId },
      take: 5,
      orderBy: { date: "desc" },
      include: {
        service: { select: { name: true } },
        operator: { select: { name: true } },
      },
    }),
    prisma.order.findMany({
      where: { userId },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: { product: { select: { name: true } } },
        },
      },
    }),
    prisma.loyaltyTransaction.findMany({
      where: { userId },
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
    prisma.review.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        operator: { select: { name: true } },
        appointment: {
          include: { service: { select: { name: true } } },
        },
      },
    }),
    prisma.appointment.groupBy({
      by: ["serviceId"],
      where: { userId, status: "COMPLETED" },
      _count: { serviceId: true },
      orderBy: { _count: { serviceId: "desc" } },
      take: 1,
    }),
    prisma.appointment.groupBy({
      by: ["operatorId"],
      where: { userId, status: "COMPLETED" },
      _count: { operatorId: true },
      orderBy: { _count: { operatorId: "desc" } },
      take: 1,
    }),
  ])

  // Resolve favorite service/operator names
  const [favoriteService, favoriteOperator] = await Promise.all([
    topServiceGroup[0]
      ? prisma.service.findUnique({
          where: { id: topServiceGroup[0].serviceId },
          select: { name: true },
        })
      : null,
    topOperatorGroup[0]
      ? prisma.user.findUnique({
          where: { id: topOperatorGroup[0].operatorId },
          select: { name: true },
        })
      : null,
  ])

  // Compute average rating
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0

  return NextResponse.json({
    user,
    stats: {
      totalAppointments,
      averageRating: Math.round(averageRating * 10) / 10,
      memberSince: user?.createdAt,
    },
    nextAppointment,
    recentAppointments,
    recentOrders,
    loyalty: {
      points: user?.loyaltyPoints ?? 0,
      recentTransactions,
    },
    reviews,
    favorites: {
      service: favoriteService?.name ?? null,
      operator: favoriteOperator?.name ?? null,
    },
  })
}
