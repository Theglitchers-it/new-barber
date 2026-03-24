import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()

  if (typeof body.staffNotes !== "string" || body.staffNotes.length > 2000) {
    return NextResponse.json({ error: "Note richieste (max 2000 caratteri)" }, { status: 400 })
  }

  const appointment = await prisma.appointment.findUnique({ where: { id } })
  if (!appointment) {
    return NextResponse.json({ error: "Appuntamento non trovato" }, { status: 404 })
  }

  const updated = await prisma.appointment.update({
    where: { id },
    data: { staffNotes: body.staffNotes },
  })

  return NextResponse.json(updated)
}
