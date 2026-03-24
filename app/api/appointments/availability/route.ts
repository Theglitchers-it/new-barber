import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const date = searchParams.get("date")
  const serviceId = searchParams.get("serviceId")

  if (!date || !serviceId) {
    return NextResponse.json({ error: "Parametri mancanti" }, { status: 400 })
  }

  // Validate date format and serviceId format
  if (!/^\d{4}-\d{2}-\d{2}/.test(date)) {
    return NextResponse.json({ error: "Formato data non valido" }, { status: 400 })
  }
  if (!/^c[a-z0-9]{20,}$/i.test(serviceId)) {
    return NextResponse.json({ error: "ID servizio non valido" }, { status: 400 })
  }

  const service = await prisma.service.findUnique({ where: { id: serviceId } })
  if (!service) {
    return NextResponse.json({ error: "Servizio non trovato" }, { status: 404 })
  }

  const dateObj = new Date(date)
  const dayOfWeek = dateObj.getDay()

  // Trova operatori disponibili per quel giorno
  const operators = await prisma.operator.findMany({
    where: { active: true },
    include: {
      availabilities: {
        where: { dayOfWeek },
      },
    },
  })

  // Trova appuntamenti esistenti per quel giorno
  const existingAppointments = await prisma.appointment.findMany({
    where: {
      date: dateObj,
      status: { not: "CANCELLED" },
    },
  })

  // Genera slot disponibili per ogni operatore
  const slots: { time: string; operatorId: string; operatorName: string; rating: number; role: string; specializations: string | null }[] = []

  for (const operator of operators) {
    if (operator.availabilities.length === 0) continue

    const availability = operator.availabilities[0]
    const [startH, startM] = availability.startTime.split(":").map(Number)
    const [endH, endM] = availability.endTime.split(":").map(Number)
    const startMinutes = startH * 60 + startM
    const endMinutes = endH * 60 + endM

    // Genera slot ogni 30 minuti
    for (let time = startMinutes; time + service.duration <= endMinutes; time += 30) {
      const slotStart = `${String(Math.floor(time / 60)).padStart(2, "0")}:${String(time % 60).padStart(2, "0")}`
      const slotEnd = `${String(Math.floor((time + service.duration) / 60)).padStart(2, "0")}:${String((time + service.duration) % 60).padStart(2, "0")}`

      // Verifica che non ci siano conflitti
      const hasConflict = existingAppointments.some(
        (apt) =>
          apt.operatorId === operator.id &&
          apt.startTime < slotEnd &&
          apt.endTime > slotStart
      )

      if (!hasConflict) {
        slots.push({
          time: slotStart,
          operatorId: operator.id,
          operatorName: operator.name,
          rating: operator.rating,
          role: operator.role,
          specializations: operator.specializations,
        })
      }
    }
  }

  // Raggruppa per orario
  const groupedSlots = slots.reduce<Record<string, { operatorId: string; operatorName: string; rating: number; role: string; specializations: string | null }[]>>(
    (acc, slot) => {
      if (!acc[slot.time]) acc[slot.time] = []
      acc[slot.time].push({ operatorId: slot.operatorId, operatorName: slot.operatorName, rating: slot.rating, role: slot.role, specializations: slot.specializations })
      return acc
    },
    {}
  )

  return NextResponse.json({
    date,
    service: { id: service.id, name: service.name, duration: service.duration },
    slots: groupedSlots,
  })
}
