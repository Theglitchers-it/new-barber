import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { APPOINTMENT_STATUS } from "@/lib/constants"
import { BeautyCalendar } from "@/components/client/beauty-calendar"
import { CalendarHeart } from "lucide-react"

export default async function CalendarioPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const userId = session.user.id

  const [initialReminders, appointments, pastAppointments] = await Promise.all([
    prisma.beautyReminder.findMany({
      where: { userId, active: true },
      include: { service: { select: { name: true, duration: true } } },
      orderBy: { suggestedDate: "asc" },
      take: 50,
    }),
    prisma.appointment.findMany({
      where: {
        userId,
        date: { gte: new Date() },
        status: { in: [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.CONFIRMED] },
      },
      include: {
        service: { select: { name: true } },
        operator: { select: { name: true } },
      },
      orderBy: { date: "asc" },
      take: 20,
    }),
    prisma.appointment.findMany({
      where: { userId, status: APPOINTMENT_STATUS.COMPLETED },
      include: { service: { select: { name: true, category: true, duration: true } } },
      orderBy: { date: "desc" },
      take: 20,
    }),
  ])

  // Auto-generate reminders from history if none exist (idempotent: only runs when 0 reminders)
  let finalReminders = initialReminders
  if (initialReminders.length === 0 && pastAppointments.length >= 2) {
    const serviceGroups = new Map<string, Date[]>()
    for (const apt of pastAppointments) {
      const dates = serviceGroups.get(apt.service.name) || []
      dates.push(new Date(apt.date))
      serviceGroups.set(apt.service.name, dates)
    }

    const now = Date.now()
    const newReminders: Array<{ userId: string; title: string; suggestedDate: Date; intervalDays: number }> = []
    for (const [serviceName, dates] of serviceGroups) {
      if (dates.length < 2) continue
      const sorted = dates.sort((a, b) => a.getTime() - b.getTime())
      let totalInterval = 0
      for (let i = 1; i < sorted.length; i++) {
        totalInterval += (sorted[i].getTime() - sorted[i - 1].getTime()) / (1000 * 60 * 60 * 24)
      }
      const avgInterval = Math.round(totalInterval / (sorted.length - 1))
      const nextDate = new Date(sorted[sorted.length - 1])
      nextDate.setDate(nextDate.getDate() + avgInterval)
      if (nextDate.getTime() < now) nextDate.setTime(now + 7 * 24 * 60 * 60 * 1000)

      newReminders.push({ userId, title: serviceName, suggestedDate: nextDate, intervalDays: avgInterval })
    }

    if (newReminders.length > 0) {
      await prisma.beautyReminder.createMany({ data: newReminders, skipDuplicates: true })
      finalReminders = await prisma.beautyReminder.findMany({
        where: { userId, active: true },
        include: { service: { select: { name: true, duration: true } } },
        orderBy: { suggestedDate: "asc" },
        take: 50,
      })
    }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-extrabold flex items-center gap-2">
          <CalendarHeart className="w-6 h-6 text-primary" />
          Calendario Bellezza
        </h1>
        <p className="text-muted-foreground mt-1">Il tuo piano di cura personalizzato</p>
      </div>

      <BeautyCalendar
        reminders={finalReminders.map((r) => ({ ...r, suggestedDate: r.suggestedDate.toISOString() }))}
        appointments={appointments.map((a) => ({ ...a, date: a.date.toISOString() }))}
      />
    </div>
  )
}
