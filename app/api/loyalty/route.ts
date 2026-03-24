import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { APPOINTMENT_STATUS } from "@/lib/constants"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  const [transactions, totalVisits, user] = await Promise.all([
    prisma.loyaltyTransaction.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        appointment: { select: { id: true, date: true, service: { select: { name: true } } } },
        order: { select: { id: true, total: true } },
      },
    }),
    prisma.appointment.count({
      where: { userId: session.user.id, status: APPOINTMENT_STATUS.COMPLETED },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { loyaltyPoints: true, loyaltyTier: true, totalPointsEarned: true, totalSpent: true },
    }),
  ])

  const userPoints = user?.loyaltyPoints ?? 0
  const tier = user?.loyaltyTier ?? "BRONZE"
  const totalPointsEarned = user?.totalPointsEarned ?? 0
  const totalSpent = user?.totalSpent ?? 0

  return NextResponse.json({
    points: userPoints,
    tier,
    totalPointsEarned,
    totalSpent,
    totalVisits,
    transactions,
  })
}
