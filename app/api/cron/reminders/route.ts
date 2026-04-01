import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendEmail, isEmailEnabled } from "@/lib/email"
import { appointmentReminder } from "@/lib/email-templates"
import { APPOINTMENT_STATUS } from "@/lib/constants"

export async function POST(request: NextRequest) {
  // Auth: cron secret only
  const cronSecret = request.headers.get("x-cron-secret")
  if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  if (!isEmailEnabled()) {
    return NextResponse.json({ error: "Email non configurata" }, { status: 503 })
  }

  // Find appointments for tomorrow that haven't been reminded
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)
  const dayAfter = new Date(tomorrow)
  dayAfter.setDate(dayAfter.getDate() + 1)

  const appointments = await prisma.appointment.findMany({
    where: {
      date: { gte: tomorrow, lt: dayAfter },
      status: { in: [APPOINTMENT_STATUS.CONFIRMED, APPOINTMENT_STATUS.PENDING] },
      reminderSent: false,
    },
    include: {
      user: { select: { email: true, name: true } },
      service: { select: { name: true } },
      operator: { select: { name: true } },
      location: { select: { address: true } },
    },
  })

  const settings = await prisma.businessSettings.findFirst({
    where: { id: "default" },
    select: { address: true },
  })

  let sent = 0
  for (const apt of appointments) {
    if (!apt.user.email) continue

    const success = await sendEmail({
      to: apt.user.email,
      subject: `Promemoria: ${apt.service.name} domani`,
      html: appointmentReminder({
        customerName: apt.user.name || "Cliente",
        serviceName: apt.service.name,
        operatorName: apt.operator.name,
        date: apt.date.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" }),
        startTime: apt.startTime,
        endTime: apt.endTime,
        totalPrice: apt.totalPrice,
        address: apt.location?.address || settings?.address || undefined,
      }),
    })

    if (success) {
      await prisma.appointment.update({
        where: { id: apt.id },
        data: { reminderSent: true },
      })
      sent++
    }
  }

  return NextResponse.json({ sent, total: appointments.length })
}
