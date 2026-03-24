import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  const { id } = await params
  const entry = await prisma.waitlistEntry.findUnique({ where: { id } })

  if (!entry) {
    return NextResponse.json({ error: "Entry non trovata" }, { status: 404 })
  }

  if (entry.userId !== session.user.id) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 })
  }

  await prisma.waitlistEntry.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
