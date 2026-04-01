import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, validationError } from "@/lib/api-utils"
import { generateRecurringDates, type RecurringPattern } from "@/lib/recurring"
import { sendEmail, isEmailEnabled } from "@/lib/email"
import { appointmentConfirmation } from "@/lib/email-templates"
import { generateGoogleCalendarUrl } from "@/lib/ical"
import { z } from "zod"

const recurringSchema = z.object({
  serviceId: z.string().min(1),
  operatorId: z.string().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  pattern: z.enum(["WEEKLY", "BIWEEKLY", "MONTHLY"]),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  locationId: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const { session, error } = await requireAuth()
    if (error) return error

    const body = await request.json()
    const parsed = recurringSchema.safeParse(body)
    if (!parsed.success) return validationError(parsed)

    const { serviceId, operatorId, startDate, startTime, pattern, endDate, locationId } = parsed.data

    const service = await prisma.service.findUnique({ where: { id: serviceId } })
    if (!service) return NextResponse.json({ error: "Servizio non trovato" }, { status: 404 })

    const [h, m] = startTime.split(":").map(Number)
    const endMinutes = h * 60 + m + service.duration
    const appointmentEndTime = `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`

    const dates = generateRecurringDates(
      new Date(startDate),
      pattern as RecurringPattern,
      new Date(endDate)
    )

    if (dates.length === 0) {
      return NextResponse.json({ error: "Nessuna data generata" }, { status: 400 })
    }

    const appointments = await prisma.$transaction(async (tx) => {
      const created: { id: string; date: Date; totalPrice: number; service: { name: string; price: number; duration: number }; operator: { name: string } }[] = []

      for (let i = 0; i < dates.length; i++) {
        const date = dates[i]

        // Check conflict
        const conflict = await tx.appointment.findFirst({
          where: {
            operatorId,
            date,
            status: { not: "CANCELLED" },
            startTime: { lt: appointmentEndTime },
            endTime: { gt: startTime },
          },
        })

        if (conflict) continue // skip conflicting slots

        const apt = await tx.appointment.create({
          data: {
            userId: session.user.id,
            serviceId,
            operatorId,
            date,
            startTime,
            endTime: appointmentEndTime,
            totalPrice: service.price,
            status: "CONFIRMED",
            recurringPattern: i === 0 ? pattern : null,
            isRecurringInstance: i > 0,
            parentAppointmentId: i > 0 && created[0] ? created[0].id : null,
            locationId: locationId || null,
          },
          include: { service: true, operator: true },
        })

        created.push(apt)
      }

      return created
    })

    // Send email for the first appointment
    if (isEmailEnabled() && appointments.length > 0) {
      const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true, name: true } })
      const settings = await prisma.businessSettings.findFirst({ where: { id: "default" }, select: { address: true } })
      if (user?.email) {
        const first = appointments[0]
        sendEmail({
          to: user.email,
          subject: `${appointments.length} appuntamenti ricorrenti confermati`,
          html: appointmentConfirmation({
            customerName: user.name || "Cliente",
            serviceName: first.service.name,
            operatorName: first.operator.name,
            date: first.date.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" }),
            startTime,
            endTime: appointmentEndTime,
            totalPrice: first.service.price,
            address: settings?.address || undefined,
            calendarUrl: generateGoogleCalendarUrl({
              date: first.date, startTime, endTime: appointmentEndTime,
              serviceName: first.service.name,
              operatorName: first.operator.name,
            }),
          }),
        }).catch(() => {})
      }
    }

    return NextResponse.json({
      created: appointments.length,
      skipped: dates.length - appointments.length,
      appointments: appointments.map((a) => ({ id: a.id, date: a.date.toISOString() })),
    }, { status: 201 })
  } catch (error) {
    console.error("Errore recurring:", error)
    return NextResponse.json({ error: "Errore nella creazione" }, { status: 500 })
  }
}
