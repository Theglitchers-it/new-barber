import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { APPOINTMENT_STATUS } from "@/lib/constants"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  const userId = session.user.id

  // Fetch last 10 completed appointments with dates + service + operator
  const history = await prisma.appointment.findMany({
    where: { userId, status: APPOINTMENT_STATUS.COMPLETED },
    orderBy: { date: "desc" },
    take: 10,
    select: {
      date: true,
      startTime: true,
      serviceId: true,
      operatorId: true,
      service: { select: { id: true, name: true, duration: true, price: true } },
      operator: { select: { id: true, name: true } },
    },
  })

  // Need at least 2 appointments to calculate patterns
  if (history.length < 2) {
    return NextResponse.json({ suggestions: null, reason: "insufficient_data" })
  }

  // Calculate average interval (days between consecutive appointments)
  const dates = history.map((a) => new Date(a.date).getTime()).sort((a, b) => a - b)
  const intervals: number[] = []
  for (let i = 1; i < dates.length; i++) {
    intervals.push(Math.round((dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24)))
  }
  const averageInterval = Math.round(intervals.reduce((s, v) => s + v, 0) / intervals.length)

  // Preferred day of week (most common)
  const dayCount = new Map<number, number>()
  for (const a of history) {
    const day = new Date(a.date).getDay()
    dayCount.set(day, (dayCount.get(day) || 0) + 1)
  }
  const preferredDayNum = [...dayCount.entries()].sort((a, b) => b[1] - a[1])[0][0]
  const dayNames = ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"]

  // Preferred time slot (morning vs afternoon)
  let morningCount = 0
  let afternoonCount = 0
  for (const a of history) {
    const hour = parseInt(a.startTime.split(":")[0])
    if (hour < 13) morningCount++
    else afternoonCount++
  }
  const suggestedTimeSlot = morningCount >= afternoonCount ? "mattina" : "pomeriggio"

  // Most booked service
  const serviceCount = new Map<string, { count: number; id: string; name: string }>()
  for (const a of history) {
    const existing = serviceCount.get(a.serviceId)
    if (existing) existing.count++
    else serviceCount.set(a.serviceId, { count: 1, id: a.service.id, name: a.service.name })
  }
  const preferredService = [...serviceCount.values()].sort((a, b) => b.count - a.count)[0]

  // Most booked operator
  const operatorCount = new Map<string, { count: number; id: string; name: string }>()
  for (const a of history) {
    const existing = operatorCount.get(a.operatorId)
    if (existing) existing.count++
    else operatorCount.set(a.operatorId, { count: 1, id: a.operator.id, name: a.operator.name })
  }
  const preferredOperator = [...operatorCount.values()].sort((a, b) => b.count - a.count)[0]

  // Calculate next suggested date
  const lastDate = new Date(Math.max(...dates))
  const nextDate = new Date(lastDate)
  nextDate.setDate(nextDate.getDate() + averageInterval)

  // If suggested date is in the past, find next occurrence of preferred day
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (nextDate < today) {
    nextDate.setTime(today.getTime())
  }
  // Adjust to preferred day of week
  while (nextDate.getDay() !== preferredDayNum) {
    nextDate.setDate(nextDate.getDate() + 1)
  }

  const daysUntil = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  let message: string
  if (daysUntil <= 0) message = `È il momento perfetto per prenotare il tuo ${preferredService.name.toLowerCase()}!`
  else if (daysUntil <= 3) message = `Il tuo prossimo ${preferredService.name.toLowerCase()} è tra ${daysUntil} giorni`
  else if (daysUntil <= 7) message = `Ti consigliamo di prenotare entro questa settimana`
  else message = `Il tuo prossimo appuntamento è previsto tra ${daysUntil} giorni`

  return NextResponse.json({
    suggestions: {
      nextSuggestedDate: nextDate.toISOString().split("T")[0],
      suggestedDay: dayNames[preferredDayNum],
      suggestedTimeSlot,
      preferredService: { id: preferredService.id, name: preferredService.name },
      preferredOperator: { id: preferredOperator.id, name: preferredOperator.name },
      averageInterval,
      daysUntil,
      message,
    },
  })
}
