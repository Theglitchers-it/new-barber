import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendEmail, isEmailEnabled } from "@/lib/email"
import { appointmentConfirmation } from "@/lib/email-templates"
import { generateGoogleCalendarUrl } from "@/lib/ical"
import { z } from "zod"
import { hashSync } from "bcryptjs"
import { randomBytes } from "crypto"
import { headers } from "next/headers"
import { appointmentLimiter, getRateLimitResponse } from "@/lib/rate-limit"

const embedBookingSchema = z.object({
  name: z.string().min(1, "Nome obbligatorio").max(100),
  email: z.string().email("Email non valida").max(255),
  phone: z.string().max(20).optional(),
  serviceId: z.string().min(1).max(50),
  operatorId: z.string().max(50).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
})

export async function POST(request: Request) {
  try {
    // Rate limit by IP
    const headersList = await headers()
    const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
    const { success } = appointmentLimiter.check(5, `embed:${ip}`)
    if (!success) return getRateLimitResponse()

    const body = await request.json()
    const parsed = embedBookingSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { name, email, phone, serviceId, operatorId, date, startTime } = parsed.data

    // Fetch service
    const service = await prisma.service.findUnique({ where: { id: serviceId } })
    if (!service || !service.active) {
      return NextResponse.json({ error: "Servizio non disponibile" }, { status: 404 })
    }

    // Find or create user
    let user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      const randomPass = randomBytes(32).toString("hex")
      user = await prisma.user.create({
        data: {
          name,
          email,
          phone: phone || null,
          hashedPassword: hashSync(randomPass, 12),
          role: "CLIENT",
        },
      })
    }

    // Calculate end time
    const [h, m] = startTime.split(":").map(Number)
    const endMinutes = h * 60 + m + service.duration
    const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`

    // Reject past dates
    const appointmentDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (appointmentDate < today) {
      return NextResponse.json({ error: "Non puoi prenotare nel passato" }, { status: 400 })
    }

    // Find operator (use first available if not specified)
    let opId = operatorId
    if (!opId) {
      const operator = await prisma.operator.findFirst({ where: { active: true } })
      opId = operator?.id
    }
    if (!opId) {
      return NextResponse.json({ error: "Nessun operatore disponibile" }, { status: 400 })
    }

    // Atomic: conflict check + create in transaction
    const appointment = await prisma.$transaction(async (tx) => {
      const conflict = await tx.appointment.findFirst({
        where: {
          operatorId: opId!,
          date: appointmentDate,
          status: { not: "CANCELLED" },
          startTime: { lt: endTime },
          endTime: { gt: startTime },
        },
      })
      if (conflict) throw new Error("CONFLICT")

      return tx.appointment.create({
        data: {
          userId: user.id,
          serviceId,
          operatorId: opId!,
          date: appointmentDate,
          startTime,
          endTime,
          totalPrice: service.price,
          status: "PENDING",
        },
        include: { service: true, operator: true },
      })
    })

    // Send confirmation email
    if (isEmailEnabled()) {
      const settings = await prisma.businessSettings.findFirst({ where: { id: "default" }, select: { address: true } })
      const aptDate = new Date(date)
      sendEmail({
        to: email,
        subject: `Prenotazione: ${service.name}`,
        html: appointmentConfirmation({
          customerName: name,
          serviceName: service.name,
          operatorName: appointment.operator.name,
          date: aptDate.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" }),
          startTime, endTime,
          totalPrice: service.price,
          address: settings?.address || undefined,
          calendarUrl: generateGoogleCalendarUrl({
            date: aptDate, startTime, endTime,
            serviceName: service.name,
            operatorName: appointment.operator.name,
            address: settings?.address || undefined,
          }),
        }),
      }).catch(() => {})
    }

    return NextResponse.json({ success: true, appointmentId: appointment.id }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === "CONFLICT") {
      return NextResponse.json({ error: "Questo slot non è più disponibile" }, { status: 409 })
    }
    console.error("Errore embed booking:", error)
    return NextResponse.json({ error: "Errore nella prenotazione" }, { status: 500 })
  }
}
