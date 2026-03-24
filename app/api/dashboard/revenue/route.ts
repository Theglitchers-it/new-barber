import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 })
  }

  const VALID_PERIODS = ["today", "week", "month", "year"]
  const rawPeriod = request.nextUrl.searchParams.get("period") || "week"
  const period = VALID_PERIODS.includes(rawPeriod) ? rawPeriod : "week"

  const now = new Date()
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)

  switch (period) {
    case "today":
      break
    case "week":
      start.setDate(start.getDate() - 7)
      break
    case "month":
      start.setMonth(start.getMonth() - 1)
      break
    case "year":
      start.setFullYear(start.getFullYear() - 1)
      break
    default:
      start.setDate(start.getDate() - 7)
  }

  const appointments = await prisma.appointment.findMany({
    where: { date: { gte: start, lte: end }, status: "COMPLETED" },
    select: { date: true, totalPrice: true },
  })

  const days = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"]
  const months = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"]
  const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

  let data: { label: string; revenue: number }[] = []

  if (period === "today") {
    const hours = Array.from({ length: 12 }, (_, i) => i + 8)
    data = hours.map((h) => {
      const hourRevenue = appointments
        .filter((a) => new Date(a.date).getHours() === h)
        .reduce((sum, a) => sum + a.totalPrice, 0)
      return { label: `${h}:00`, revenue: Math.round(hourRevenue) }
    })
  } else if (diffDays <= 8) {
    data = Array.from({ length: diffDays }, (_, i) => {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      const dayRevenue = appointments
        .filter((a) => new Date(a.date).toDateString() === d.toDateString())
        .reduce((sum, a) => sum + a.totalPrice, 0)
      return { label: days[d.getDay()], revenue: Math.round(dayRevenue) }
    })
  } else if (diffDays <= 31) {
    data = Array.from({ length: diffDays }, (_, i) => {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      const dayRevenue = appointments
        .filter((a) => new Date(a.date).toDateString() === d.toDateString())
        .reduce((sum, a) => sum + a.totalPrice, 0)
      return { label: `${d.getDate()}/${d.getMonth() + 1}`, revenue: Math.round(dayRevenue) }
    })
  } else {
    data = Array.from({ length: 12 }, (_, i) => {
      const monthRevenue = appointments
        .filter((a) => new Date(a.date).getMonth() === (start.getMonth() + i) % 12)
        .reduce((sum, a) => sum + a.totalPrice, 0)
      return { label: months[(start.getMonth() + i) % 12], revenue: Math.round(monthRevenue) }
    })
  }

  return NextResponse.json(data)
}
