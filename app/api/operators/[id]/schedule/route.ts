import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { scheduleSchema } from "@/lib/validations/settings"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()
  const parsed = scheduleSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    )
  }

  const operator = await prisma.operator.findUnique({ where: { id } })
  if (!operator) {
    return NextResponse.json({ error: "Operatore non trovato" }, { status: 404 })
  }

  // Elimina disponibilità esistenti e ricrea
  await prisma.operatorAvailability.deleteMany({
    where: { operatorId: id },
  })

  const availabilities = await prisma.operatorAvailability.createMany({
    data: parsed.data.availabilities.map((avail) => ({
      operatorId: id,
      dayOfWeek: avail.dayOfWeek,
      startTime: avail.startTime,
      endTime: avail.endTime,
    })),
  })

  // Restituisci l'operatore aggiornato con le nuove disponibilità
  const updated = await prisma.operator.findUnique({
    where: { id },
    include: {
      availabilities: {
        orderBy: { dayOfWeek: "asc" },
      },
    },
  })

  return NextResponse.json(updated)
}
