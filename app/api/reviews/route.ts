import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const ratingParam = searchParams.get("rating")
  const operatorId = searchParams.get("operatorId")

  const isAdmin = session.user.role === "ADMIN"

  const where: Record<string, unknown> = {}

  if (!isAdmin) {
    where.userId = session.user.id
  }

  if (ratingParam) {
    const rating = parseInt(ratingParam)
    if (isNaN(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating deve essere tra 1 e 5" }, { status: 400 })
    }
    where.rating = rating
  }

  if (operatorId) {
    if (!/^c[a-z0-9]{24,}$/i.test(operatorId)) {
      return NextResponse.json({ error: "ID operatore non valido" }, { status: 400 })
    }
    where.operatorId = operatorId
  }

  const reviews = await prisma.review.findMany({
    where,
    include: {
      user: { select: { id: true, name: true } },
      operator: { select: { id: true, name: true } },
      appointment: {
        select: { id: true, date: true, service: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(reviews)
}
