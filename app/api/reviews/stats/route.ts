import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  const [avgResult, groupResult] = await Promise.all([
    prisma.review.aggregate({
      where: { visible: true },
      _avg: { rating: true },
      _count: true,
    }),
    prisma.review.groupBy({
      by: ["rating"],
      where: { visible: true },
      _count: true,
    }),
  ])

  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  for (const g of groupResult) {
    distribution[g.rating] = g._count
  }

  return NextResponse.json({
    average: avgResult._avg.rating ? Math.round(avgResult._avg.rating * 10) / 10 : 0,
    total: avgResult._count,
    distribution,
  })
}
