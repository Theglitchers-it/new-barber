import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()

  if (!body.reply || typeof body.reply !== "string" || body.reply.length > 2000) {
    return NextResponse.json({ error: "Risposta richiesta (max 2000 caratteri)" }, { status: 400 })
  }

  const review = await prisma.review.findUnique({ where: { id } })
  if (!review) {
    return NextResponse.json({ error: "Recensione non trovata" }, { status: 404 })
  }

  const updated = await prisma.review.update({
    where: { id },
    data: {
      reply: body.reply,
      replyDate: new Date(),
    },
  })

  return NextResponse.json(updated)
}
