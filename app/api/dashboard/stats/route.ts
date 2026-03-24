import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

const VALID_PERIODS = ["today", "week", "month", "year"] as const

function getPeriodRange(period: string) {
  const now = new Date()
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)

  switch (period) {
    case "today":
      return { start, end, label: "Oggi" }
    case "week": {
      const weekStart = new Date(start)
      weekStart.setDate(weekStart.getDate() - 7)
      return { start: weekStart, end, label: "Settimana" }
    }
    case "month": {
      const monthStart = new Date(start)
      monthStart.setMonth(monthStart.getMonth() - 1)
      return { start: monthStart, end, label: "Mese" }
    }
    case "year": {
      const yearStart = new Date(start)
      yearStart.setFullYear(yearStart.getFullYear() - 1)
      return { start: yearStart, end, label: "Anno" }
    }
    default: {
      const defaultStart = new Date(start)
      defaultStart.setDate(defaultStart.getDate() - 7)
      return { start: defaultStart, end, label: "Settimana" }
    }
  }
}

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 })
  }

  const rawPeriod = request.nextUrl.searchParams.get("period") || "week"
  const period = VALID_PERIODS.includes(rawPeriod as typeof VALID_PERIODS[number]) ? rawPeriod : "week"
  const { start, end } = getPeriodRange(period)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const [
    appointmentsCount,
    completedAppointments,
    revenue,
    newClients,
    reviews,
    noShows,
    totalInPeriod,
    loyaltyPoints,
    productsSold,
    weeklyAppointments,
    topServicesRaw,
    todayList,
    recentActivity,
  ] = await Promise.all([
    // Appuntamenti nel periodo (esclusi cancellati)
    prisma.appointment.count({
      where: { date: { gte: start, lt: end }, status: { not: "CANCELLED" } },
    }),
    // Completati nel periodo
    prisma.appointment.count({
      where: { date: { gte: start, lt: end }, status: "COMPLETED" },
    }),
    // Revenue nel periodo
    prisma.appointment.aggregate({
      where: { date: { gte: start, lt: end }, status: "COMPLETED" },
      _sum: { totalPrice: true },
    }),
    // Nuovi clienti nel periodo
    prisma.user.count({
      where: { role: "CLIENT", createdAt: { gte: start, lt: end } },
    }),
    // Rating medio nel periodo
    prisma.review.aggregate({
      where: { createdAt: { gte: start, lt: end } },
      _avg: { rating: true },
      _count: true,
    }),
    // No-show nel periodo
    prisma.appointment.count({
      where: { date: { gte: start, lt: end }, noShow: true },
    }),
    // Totale appuntamenti nel periodo (inclusi cancellati, per calcolo tasso)
    prisma.appointment.count({
      where: { date: { gte: start, lt: end } },
    }),
    // Punti fedeltà emessi nel periodo
    prisma.loyaltyTransaction.aggregate({
      where: { type: "EARNED", createdAt: { gte: start, lt: end } },
      _sum: { points: true },
    }),
    // Prodotti venduti nel periodo
    prisma.orderItem.aggregate({
      where: { order: { createdAt: { gte: start, lt: end }, status: { not: "CANCELLED" } } },
      _sum: { quantity: true },
    }),
    // Revenue data per chart
    prisma.appointment.findMany({
      where: { date: { gte: start, lt: end }, status: "COMPLETED" },
      select: { date: true, totalPrice: true },
    }),
    // Top servizi
    prisma.appointment.groupBy({
      by: ["serviceId"],
      where: { date: { gte: start, lt: end }, status: { not: "CANCELLED" } },
      _count: true,
      _sum: { totalPrice: true },
      orderBy: { _count: { serviceId: "desc" } },
      take: 5,
    }),
    // Appuntamenti di oggi
    prisma.appointment.findMany({
      where: { date: { gte: today, lt: tomorrow } },
      include: {
        service: true,
        operator: true,
        user: { select: { name: true } },
      },
      orderBy: { startTime: "asc" },
    }),
    // Attività recenti
    prisma.appointment.findMany({
      where: { updatedAt: { gte: start } },
      include: {
        service: { select: { name: true } },
        operator: { select: { name: true } },
        user: { select: { name: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
  ])

  // Genera dati per il chart revenue
  const days = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"]
  const months = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"]
  const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

  let revenueData: { label: string; revenue: number }[] = []

  if (diffDays <= 1) {
    // Today: group by hour
    const hours = Array.from({ length: 12 }, (_, i) => i + 8)
    revenueData = hours.map((h) => {
      const hourRevenue = weeklyAppointments
        .filter((a) => new Date(a.date).getHours() === h)
        .reduce((sum, a) => sum + a.totalPrice, 0)
      return { label: `${h}:00`, revenue: Math.round(hourRevenue) }
    })
  } else if (diffDays <= 7) {
    // Week: group by day
    revenueData = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      const dayRevenue = weeklyAppointments
        .filter((a) => new Date(a.date).toDateString() === d.toDateString())
        .reduce((sum, a) => sum + a.totalPrice, 0)
      return { label: days[d.getDay()], revenue: Math.round(dayRevenue) }
    })
  } else if (diffDays <= 31) {
    // Month: group by day
    revenueData = Array.from({ length: diffDays }, (_, i) => {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      const dayRevenue = weeklyAppointments
        .filter((a) => new Date(a.date).toDateString() === d.toDateString())
        .reduce((sum, a) => sum + a.totalPrice, 0)
      return { label: `${d.getDate()}`, revenue: Math.round(dayRevenue) }
    })
  } else {
    // Year: group by month
    revenueData = Array.from({ length: 12 }, (_, i) => {
      const monthRevenue = weeklyAppointments
        .filter((a) => new Date(a.date).getMonth() === (start.getMonth() + i) % 12)
        .reduce((sum, a) => sum + a.totalPrice, 0)
      return { label: months[(start.getMonth() + i) % 12], revenue: Math.round(monthRevenue) }
    })
  }

  // Carica nomi dei servizi top
  const serviceIds = topServicesRaw.map((s) => s.serviceId)
  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds } },
  })
  const serviceMap = new Map(services.map((s) => [s.id, s]))

  const noShowRate = totalInPeriod > 0 ? Math.round((noShows / totalInPeriod) * 100) : 0
  const completionRate = totalInPeriod > 0 ? Math.round((completedAppointments / totalInPeriod) * 100) : 0

  return NextResponse.json({
    appointmentsCount,
    revenue: revenue._sum.totalPrice || 0,
    newClients,
    avgRating: reviews._avg.rating ? Math.round(reviews._avg.rating * 10) / 10 : 0,
    noShowRate,
    completionRate,
    loyaltyPointsIssued: loyaltyPoints._sum.points || 0,
    productsSold: productsSold._sum.quantity || 0,
    revenueData,
    topServices: topServicesRaw.map((s) => ({
      name: serviceMap.get(s.serviceId)?.name || "N/A",
      count: s._count,
      revenue: s._sum.totalPrice || 0,
    })),
    todayAppointments: todayList,
    recentActivity: recentActivity.map((a) => ({
      id: a.id,
      status: a.status,
      serviceName: a.service.name,
      operatorName: a.operator.name,
      clientName: a.user.name,
      updatedAt: a.updatedAt,
    })),
  })
}
