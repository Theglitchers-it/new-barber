import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/api-utils"
import { generateICS } from "@/lib/ical"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth()
  if (error) return error

  const { id } = await params

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      service: { select: { name: true } },
      operator: { select: { name: true } },
      location: { select: { address: true } },
    },
  })

  if (!appointment) {
    return NextResponse.json({ error: "Appuntamento non trovato" }, { status: 404 })
  }

  // Verify ownership or admin
  if (appointment.userId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 })
  }

  const settings = await prisma.businessSettings.findFirst({ where: { id: "default" } })

  const ics = generateICS({
    date: appointment.date,
    startTime: appointment.startTime,
    endTime: appointment.endTime,
    serviceName: appointment.service.name,
    operatorName: appointment.operator.name,
    salonName: settings?.salonName || "SalonPro",
    address: appointment.location?.address || settings?.address || undefined,
    notes: appointment.notes || undefined,
  })

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="appuntamento-${id}.ics"`,
    },
  })
}
