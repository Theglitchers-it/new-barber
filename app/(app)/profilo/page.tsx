import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { ProfiloClient } from "./profilo-client"

export default async function ProfiloPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

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
    reviewsAgg,
    topServiceGroup,
    topOperatorGroup,
    recommendedProducts,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        phone: true,
        hairType: true,
        birthDate: true,
        avatar: true,
        loyaltyPoints: true,
        totalSpent: true,
        createdAt: true,
        preferredContact: true,
        notes: true,
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
          select: { quantity: true, product: { select: { name: true } } },
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
      take: 5,
      select: {
        id: true,
        rating: true,
        comment: true,
        reply: true,
        createdAt: true,
        operator: { select: { name: true } },
        appointment: {
          select: { date: true, service: { select: { name: true } } },
        },
      },
    }),
    prisma.review.aggregate({
      where: { userId },
      _avg: { rating: true },
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
    prisma.product.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        price: true,
        originalPrice: true,
        image: true,
        category: true,
      },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
  ])

  if (!user) redirect("/login")

  // Resolve favorite service/operator names
  const [favoriteService, favoriteOperator] = await Promise.all([
    topServiceGroup[0]
      ? prisma.service.findUnique({
          where: { id: topServiceGroup[0].serviceId },
          select: { name: true },
        })
      : null,
    topOperatorGroup[0]
      ? prisma.operator.findUnique({
          where: { id: topOperatorGroup[0].operatorId },
          select: { name: true },
        })
      : null,
  ])

  const averageRating = reviewsAgg._avg.rating
    ? Math.round(reviewsAgg._avg.rating * 10) / 10
    : 0

  const statsData = {
    user: {
      name: user.name,
      email: user.email,
      phone: user.phone,
      hairType: user.hairType,
      avatar: user.avatar,
      loyaltyPoints: user.loyaltyPoints,
      totalSpent: user.totalSpent,
    },
    stats: {
      totalAppointments,
      averageRating,
      memberSince: user.createdAt.toISOString(),
    },
    nextAppointment: nextAppointment
      ? {
          id: nextAppointment.id,
          date: nextAppointment.date.toISOString(),
          startTime: nextAppointment.startTime,
          endTime: nextAppointment.endTime,
          status: nextAppointment.status,
          service: nextAppointment.service,
          operator: nextAppointment.operator,
        }
      : null,
    recentAppointments: recentAppointments.map((a) => ({
      id: a.id,
      date: a.date.toISOString(),
      startTime: a.startTime,
      status: a.status,
      totalPrice: a.totalPrice,
      service: a.service,
      operator: a.operator,
    })),
    recentOrders: recentOrders.map((o) => ({
      id: o.id,
      total: o.total,
      status: o.status,
      createdAt: o.createdAt.toISOString(),
      items: o.items.map((i) => ({ product: i.product, quantity: i.quantity })),
    })),
    loyalty: {
      points: user.loyaltyPoints,  // also in statsData.user for profile display
      recentTransactions: recentTransactions.map((t) => ({
        id: t.id,
        points: t.points,
        type: t.type,
        reason: t.reason,
        createdAt: t.createdAt.toISOString(),
      })),
    },
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      reply: r.reply,
      createdAt: r.createdAt.toISOString(),
      operator: r.operator,
      appointment: {
        date: r.appointment.date.toISOString(),
        service: r.appointment.service,
      },
    })),
    favorites: {
      service: favoriteService?.name ?? null,
      operator: favoriteOperator?.name ?? null,
    },
    recommendedProducts: recommendedProducts.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      originalPrice: p.originalPrice,
      image: p.image,
      category: p.category,
    })),
  }

  return (
    <ProfiloClient
      initialData={statsData}
      initialProfile={{
        preferredContact: user.preferredContact ?? null,
        notes: user.notes ?? null,
        birthDate: user.birthDate?.toISOString().split("T")[0] ?? null,
      }}
    />
  )
}
