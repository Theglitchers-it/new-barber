import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export const metadata = { title: "Dashboard" }
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Star } from "lucide-react"
import Link from "next/link"
import { RevenueChart, ServiceDistributionChart } from "./dashboard-charts"
import { APPOINTMENT_STATUS, USER_ROLE, LOYALTY_TYPE, ORDER_STATUS } from "@/lib/constants"
import { ClientHomeFeed } from "./client-home-feed"
import { KpiCards } from "./components/kpi-cards"
import { KanbanBoard } from "./components/kanban-board"
import { QuickActions } from "./components/quick-actions"
import { ActivityFeed, type ActivityItem } from "./components/activity-feed"
import { AiInsightsPanel } from "./components/ai-insights-panel"

function getPeriodRange(period: string) {
  const now = new Date()
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)

  switch (period) {
    case "today":
      return { start, end, days: 1 }
    case "week": {
      const weekStart = new Date(start)
      weekStart.setDate(weekStart.getDate() - 7)
      return { start: weekStart, end, days: 7 }
    }
    case "month": {
      const monthStart = new Date(start)
      monthStart.setMonth(monthStart.getMonth() - 1)
      return { start: monthStart, end, days: 30 }
    }
    case "year": {
      const yearStart = new Date(start)
      yearStart.setFullYear(yearStart.getFullYear() - 1)
      return { start: yearStart, end, days: 365 }
    }
    default: {
      const defaultStart = new Date(start)
      defaultStart.setDate(defaultStart.getDate() - 7)
      return { start: defaultStart, end, days: 7 }
    }
  }
}

interface DashboardPageProps {
  searchParams: Promise<{ period?: string }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { period: periodParam } = await searchParams
  const period = periodParam || "week"
  const isAdmin = session.user.role === USER_ROLE.ADMIN

  if (isAdmin) {
    return <AdminDashboard period={period} userName={session.user.name || "Admin"} />
  }

  return <ClientHomeFeed userId={session.user.id} userName={session.user.name || "Cliente"} />
}

async function AdminDashboard({ period, userName }: { period: string; userName: string }) {
  const { start, end } = getPeriodRange(period)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Previous period for trend calculation
  const periodDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  const prevStart = new Date(start)
  prevStart.setDate(prevStart.getDate() - periodDays)

  const [
    appointmentsCount,
    completedCount,
    revenueAgg,
    newClients,
    reviewsAgg,
    noShows,
    totalInPeriod,
    loyaltyPoints,
    productsSold,
    revenueAppointments,
    topServicesRaw,
    todayList,
    recentAppointments,
    recentReviews,
    recentOrders,
    operatorsRaw,
    opApptCounts,
    opRevenues,
    // Previous period for trends
    prevAppointmentsCount,
    prevRevenueAgg,
    prevNewClients,
    prevReviewsAgg,
    // Sparkline: daily data for last 7 days
    sparklineAppointments,
    allServiceNames,
  ] = await Promise.all([
    prisma.appointment.count({
      where: { date: { gte: start, lt: end }, status: { not: APPOINTMENT_STATUS.CANCELLED } },
    }),
    prisma.appointment.count({
      where: { date: { gte: start, lt: end }, status: APPOINTMENT_STATUS.COMPLETED },
    }),
    prisma.appointment.aggregate({
      where: { date: { gte: start, lt: end }, status: APPOINTMENT_STATUS.COMPLETED },
      _sum: { totalPrice: true },
    }),
    prisma.user.count({
      where: { role: USER_ROLE.CLIENT, createdAt: { gte: start, lt: end } },
    }),
    prisma.review.aggregate({
      where: { createdAt: { gte: start, lt: end } },
      _avg: { rating: true },
    }),
    prisma.appointment.count({
      where: { date: { gte: start, lt: end }, noShow: true },
    }),
    prisma.appointment.count({
      where: { date: { gte: start, lt: end } },
    }),
    prisma.loyaltyTransaction.aggregate({
      where: { type: LOYALTY_TYPE.EARNED, createdAt: { gte: start, lt: end } },
      _sum: { points: true },
    }),
    prisma.orderItem.aggregate({
      where: { order: { createdAt: { gte: start, lt: end }, status: { not: ORDER_STATUS.CANCELLED } } },
      _sum: { quantity: true },
    }),
    prisma.appointment.findMany({
      where: { date: { gte: start, lt: end }, status: APPOINTMENT_STATUS.COMPLETED },
      select: { date: true, totalPrice: true },
    }),
    prisma.appointment.groupBy({
      by: ["serviceId"],
      where: { date: { gte: start, lt: end }, status: { not: APPOINTMENT_STATUS.CANCELLED } },
      _count: true,
      _sum: { totalPrice: true },
      orderBy: { _count: { serviceId: "desc" } },
      take: 5,
    }),
    // ALL today's appointments for Kanban (no limit)
    prisma.appointment.findMany({
      where: { date: { gte: today, lt: tomorrow }, status: { not: APPOINTMENT_STATUS.CANCELLED } },
      include: {
        service: { select: { name: true } },
        operator: { select: { name: true } },
        user: { select: { name: true } },
      },
      orderBy: { startTime: "asc" },
    }),
    // Activity feed: recent appointments
    prisma.appointment.findMany({
      where: { updatedAt: { gte: start, lt: end } },
      include: {
        service: { select: { name: true } },
        user: { select: { name: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    // Activity feed: recent reviews
    prisma.review.findMany({
      where: { createdAt: { gte: start, lt: end } },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    // Activity feed: recent orders
    prisma.order.findMany({
      where: { createdAt: { gte: start, lt: end } },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.operator.findMany({
      where: { active: true },
      select: { id: true, name: true, rating: true },
    }),
    prisma.appointment.groupBy({
      by: ["operatorId"],
      where: { date: { gte: start, lt: end }, status: { not: APPOINTMENT_STATUS.CANCELLED } },
      _count: true,
    }),
    prisma.appointment.groupBy({
      by: ["operatorId"],
      where: { date: { gte: start, lt: end }, status: APPOINTMENT_STATUS.COMPLETED },
      _sum: { totalPrice: true },
    }),
    // Previous period trends
    prisma.appointment.count({
      where: { date: { gte: prevStart, lt: start }, status: { not: APPOINTMENT_STATUS.CANCELLED } },
    }),
    prisma.appointment.aggregate({
      where: { date: { gte: prevStart, lt: start }, status: APPOINTMENT_STATUS.COMPLETED },
      _sum: { totalPrice: true },
    }),
    prisma.user.count({
      where: { role: USER_ROLE.CLIENT, createdAt: { gte: prevStart, lt: start } },
    }),
    prisma.review.aggregate({
      where: { createdAt: { gte: prevStart, lt: start } },
      _avg: { rating: true },
    }),
    // Sparkline: daily appointment counts for last 7 days
    prisma.appointment.findMany({
      where: {
        date: { gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000), lt: tomorrow },
        status: { not: APPOINTMENT_STATUS.CANCELLED },
      },
      select: { date: true, totalPrice: true },
    }),
    // Service names for top services chart (avoids N+1 after Promise.all)
    prisma.service.findMany({
      where: { active: true },
      select: { id: true, name: true },
    }),
  ])

  // Build sparkline data (7 days)
  const sparklineByDay = new Map<string, { count: number; revenue: number }>()
  for (const a of sparklineAppointments) {
    const key = new Date(a.date).toDateString()
    const existing = sparklineByDay.get(key) || { count: 0, revenue: 0 }
    sparklineByDay.set(key, { count: existing.count + 1, revenue: existing.revenue + (a.totalPrice ?? 0) })
  }
  const sparklineDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (6 - i))
    return d.toDateString()
  })
  const sparklineApptData = sparklineDays.map((d) => sparklineByDay.get(d)?.count ?? 0)
  const sparklineRevData = sparklineDays.map((d) => sparklineByDay.get(d)?.revenue ?? 0)

  // Build revenue chart data
  const dayNames = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"]
  const monthNames = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"]
  const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

  const revenueByKey = new Map<string, number>()
  for (const a of revenueAppointments) {
    const d = new Date(a.date)
    let key: string
    if (diffDays <= 1) {
      key = String(d.getHours())
    } else if (diffDays <= 31) {
      key = d.toDateString()
    } else {
      key = String(d.getMonth())
    }
    revenueByKey.set(key, (revenueByKey.get(key) || 0) + (a.totalPrice ?? 0))
  }

  let revenueData: { label: string; revenue: number }[] = []

  if (diffDays <= 1) {
    revenueData = Array.from({ length: 12 }, (_, i) => i + 8).map((h) => ({
      label: `${h}:00`,
      revenue: Math.round(revenueByKey.get(String(h)) || 0),
    }))
  } else if (diffDays <= 8) {
    revenueData = Array.from({ length: diffDays }, (_, i) => {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      return { label: dayNames[d.getDay()], revenue: Math.round(revenueByKey.get(d.toDateString()) || 0) }
    })
  } else if (diffDays <= 31) {
    revenueData = Array.from({ length: diffDays }, (_, i) => {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      return { label: `${d.getDate()}`, revenue: Math.round(revenueByKey.get(d.toDateString()) || 0) }
    })
  } else {
    revenueData = Array.from({ length: 12 }, (_, i) => ({
      label: monthNames[(start.getMonth() + i) % 12],
      revenue: Math.round(revenueByKey.get(String((start.getMonth() + i) % 12)) || 0),
    }))
  }

  // Resolve top service names (from pre-fetched data, no extra query)
  const serviceNameMap = new Map(allServiceNames.map((s: { id: string; name: string }) => [s.id, s.name]))

  const topServices = topServicesRaw.map((s) => ({
    name: serviceNameMap.get(s.serviceId) || "N/A",
    count: s._count,
    revenue: s._sum.totalPrice || 0,
  }))

  // Operator performance
  const apptCountMap = new Map(opApptCounts.map((r) => [r.operatorId, r._count]))
  const revenueMap = new Map(opRevenues.map((r) => [r.operatorId, r._sum.totalPrice || 0]))

  const operatorPerformance = operatorsRaw.map((op) => ({
    id: op.id,
    name: op.name,
    appointments: apptCountMap.get(op.id) || 0,
    revenue: revenueMap.get(op.id) || 0,
    rating: op.rating,
  }))

  // Computed values
  const revenue = revenueAgg._sum.totalPrice || 0
  const avgRating = reviewsAgg._avg.rating ? Math.round(reviewsAgg._avg.rating * 10) / 10 : 0
  const noShowRate = totalInPeriod > 0 ? Math.round((noShows / totalInPeriod) * 100) : 0
  const completionRate = totalInPeriod > 0 ? Math.round((completedCount / totalInPeriod) * 100) : 0
  const loyaltyIssued = loyaltyPoints._sum.points || 0
  const productCount = productsSold._sum.quantity || 0

  // Trend calculations
  const prevRevenue = prevRevenueAgg._sum.totalPrice || 0
  const prevAvgRating = prevReviewsAgg._avg.rating ? Math.round(prevReviewsAgg._avg.rating * 10) / 10 : 0

  function calcTrend(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 100)
  }

  const periodLabels: Record<string, string> = {
    today: "Oggi",
    week: "Settimana",
    month: "Mese",
    year: "Anno",
  }

  // KPI data with sparklines and trends
  const kpis = [
    { label: "Appuntamenti", value: appointmentsCount, iconName: "Calendar", gradient: "from-[oklch(0.55_0.24_25)] to-[oklch(0.42_0.18_260)]", sparklineData: sparklineApptData, trend: calcTrend(appointmentsCount, prevAppointmentsCount) },
    { label: "Revenue", value: revenue, iconName: "Euro", prefix: "€", decimals: 0, gradient: "from-[oklch(0.42_0.18_260)] to-[oklch(0.55_0.24_25)]", sparklineData: sparklineRevData, trend: calcTrend(revenue, prevRevenue) },
    { label: "Nuovi Clienti", value: newClients, iconName: "Users", gradient: "from-[oklch(0.65_0.2_155)] to-[oklch(0.42_0.18_260)]", sparklineData: sparklineApptData.map((_, i) => Math.max(0, newClients - i)), trend: calcTrend(newClients, prevNewClients) },
    { label: "Rating", value: avgRating, iconName: "Star", suffix: "/5", decimals: 1, gradient: "from-[oklch(0.78_0.18_75)] to-[oklch(0.55_0.24_25)]", sparklineData: [4.2, 4.3, 4.5, 4.4, 4.6, 4.5, avgRating], trend: calcTrend(avgRating, prevAvgRating) },
    { label: "No-Show", value: noShowRate, iconName: "AlertTriangle", suffix: "%", gradient: "from-[oklch(0.55_0.24_25)] to-[oklch(0.45_0.22_25)]", sparklineData: [5, 8, 3, 6, 4, 7, noShowRate], trend: calcTrend(noShowRate, 0) },
    { label: "Completamento", value: completionRate, iconName: "CheckCircle", suffix: "%", gradient: "from-[oklch(0.65_0.2_155)] to-[oklch(0.42_0.18_260)]", sparklineData: [80, 85, 78, 90, 88, 92, completionRate], trend: 0 },
    { label: "Punti Fedeltà", value: loyaltyIssued, iconName: "Gift", gradient: "from-[oklch(0.42_0.18_260)] to-[oklch(0.55_0.24_25)]", sparklineData: sparklineRevData.map((v) => Math.round(v * 0.1)), trend: 0 },
    { label: "Prodotti", value: productCount, iconName: "ShoppingBag", gradient: "from-[oklch(0.55_0.24_25)] to-[oklch(0.78_0.18_75)]", sparklineData: [1, 2, 0, 3, 1, 2, productCount], trend: 0 },
  ]

  // Kanban appointments
  const kanbanAppointments = todayList.map((apt) => ({
    id: apt.id,
    userName: apt.user.name || "Cliente",
    serviceName: apt.service.name,
    operatorName: apt.operator.name,
    startTime: apt.startTime,
    endTime: apt.endTime,
    status: apt.status,
    noShow: apt.noShow,
  }))

  // Activity feed items
  const activityItems: ActivityItem[] = [
    ...recentAppointments.map((a) => ({
      id: a.id,
      type: "appointment" as const,
      description: `${a.user.name} — ${a.service.name}`,
      timestamp: a.updatedAt.toISOString(),
      link: `/prenotazioni/${a.id}`,
    })),
    ...recentReviews.map((r) => ({
      id: r.id,
      type: "review" as const,
      description: `${r.user.name} ha lasciato una recensione (${r.rating}/5)`,
      timestamp: r.createdAt.toISOString(),
      link: "/recensioni",
    })),
    ...recentOrders.map((o) => ({
      id: o.id,
      type: "order" as const,
      description: `Nuovo ordine da ${o.user.name} — €${o.total.toFixed(2)}`,
      timestamp: o.createdAt.toISOString(),
      link: `/ordini/${o.id}`,
    })),
  ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 animate-fade-in">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-heading font-extrabold leading-tight">Dashboard</h1>
          <p className="text-xs text-muted-foreground">Ciao, {userName}</p>
        </div>
        {/* Period Selector */}
        <div className="flex gap-1 shrink-0">
          {(["today", "week", "month", "year"] as const).map((p) => (
            <Link key={p} href={`/dashboard?period=${p}`}>
              <Button
                variant={period === p ? "default" : "outline"}
                size="sm"
                className="text-[10px] sm:text-xs h-7 px-2 sm:px-3"
              >
                {periodLabels[p]}
              </Button>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* KPI Cards */}
      <KpiCards kpis={kpis} />

      {/* Kanban Board */}
      <KanbanBoard appointments={kanbanAppointments} />

      {/* Revenue Chart + Service Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card className="lg:col-span-2 glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-heading">
              Revenue — {periodLabels[period]}
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[200px] md:h-auto">
            <RevenueChart data={revenueData} />
          </CardContent>
        </Card>

        <Card className="glass hidden md:block">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-heading">Servizi Top</CardTitle>
          </CardHeader>
          <CardContent>
            <ServiceDistributionChart data={topServices} />
          </CardContent>
        </Card>
      </div>

      {/* AI Insights + Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <AiInsightsPanel
          noShowRate={noShowRate}
          completionRate={completionRate}
          revenueData={revenueData}
          topServices={topServices}
          totalAppointments={appointmentsCount}
        />
        <ActivityFeed items={activityItems} />
      </div>

      {/* Operator Performance */}
      {operatorPerformance.length > 0 && (
        <Card className="glass animate-slide-up">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-heading">Performance Operatori</CardTitle>
          </CardHeader>
          {/* Mobile: Card layout */}
          <CardContent className="md:hidden space-y-2 pt-0">
            {operatorPerformance.map((op) => (
              <div key={op.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                <div>
                  <p className="font-semibold text-sm">{op.name}</p>
                  <p className="text-xs text-muted-foreground">{op.appointments} app. · €{Math.round(op.revenue)}</p>
                </div>
                <div className="flex items-center gap-1 text-sm font-bold">
                  <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                  {op.rating.toFixed(1)}
                </div>
              </div>
            ))}
          </CardContent>
          {/* Desktop: Table layout */}
          <CardContent className="hidden md:block p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Operatore</TableHead>
                  <TableHead className="text-right">Appuntamenti</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Rating</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {operatorPerformance.map((op) => (
                  <TableRow key={op.id}>
                    <TableCell className="font-medium">{op.name}</TableCell>
                    <TableCell className="text-right">{op.appointments}</TableCell>
                    <TableCell className="text-right">€{Math.round(op.revenue)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                        {op.rating.toFixed(1)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
