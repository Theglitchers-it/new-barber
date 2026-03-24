import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 })
  }

  const { id } = await params

  const review = await prisma.review.findUnique({ where: { id } })
  if (!review) {
    return NextResponse.json({ error: "Recensione non trovata" }, { status: 404 })
  }

  const updated = await prisma.review.update({
    where: { id },
    data: { visible: !review.visible },
  })

  return NextResponse.json(updated)
}
