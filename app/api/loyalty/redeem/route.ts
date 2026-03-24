import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { LOYALTY_TYPE } from "@/lib/constants"
import { redeemLimiter, getRateLimitResponse } from "@/lib/rate-limit"

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  const { success } = redeemLimiter.check(3, session.user.id)
  if (!success) return getRateLimitResponse()

  const body = await request.json()
  const points = body.points

  if (!points || typeof points !== "number" || !Number.isInteger(points) || points <= 0 || points > 100000) {
    return NextResponse.json({ error: "Punti non validi" }, { status: 400 })
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Pessimistic lock: SELECT FOR UPDATE prevents concurrent reads
      const rows = await tx.$queryRaw<{ loyaltyPoints: number }[]>`
        SELECT "loyaltyPoints" FROM "User" WHERE "id" = ${session.user.id} FOR UPDATE
      `
      const userPoints = rows[0]?.loyaltyPoints ?? 0

      if (userPoints < points) {
        throw new Error("INSUFFICIENT_POINTS")
      }

      const [updatedUser, transaction] = await Promise.all([
        tx.user.update({
          where: { id: session.user.id },
          data: { loyaltyPoints: { decrement: points } },
        }),
        tx.loyaltyTransaction.create({
          data: {
            userId: session.user.id,
            points: -points,
            type: LOYALTY_TYPE.REDEEMED,
            reason: "Riscatto punti fedeltà",
          },
        }),
      ])

      return { points: updatedUser.loyaltyPoints, transaction }
    })

    return NextResponse.json(result)
  } catch (e) {
    if (e instanceof Error && e.message === "INSUFFICIENT_POINTS") {
      return NextResponse.json({ error: "Punti insufficienti" }, { status: 400 })
    }
    return NextResponse.json({ error: "Errore nel riscatto" }, { status: 500 })
  }
}
