import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 })
  }

  const { id } = await params

  const appointment = await prisma.appointment.findUnique({ where: { id } })
  if (!appointment) {
    return NextResponse.json({ error: "Appuntamento non trovato" }, { status: 404 })
  }

  const updated = await prisma.appointment.update({
    where: { id },
    data: { noShow: true },
  })

  return NextResponse.json(updated)
}
