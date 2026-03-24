import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { REFERRAL_STATUS } from "@/lib/constants"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  try {
    // Get top 10 referrers by completed referral count
    const topReferrers = await prisma.referral.groupBy({
      by: ["referrerId"],
      where: { status: REFERRAL_STATUS.COMPLETED },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    })

    if (topReferrers.length === 0) {
      return NextResponse.json([])
    }

    // Fetch user details for the top referrers
    const userIds = topReferrers.map((r) => r.referrerId)
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, image: true },
    })

    const userMap = new Map(users.map((u) => [u.id, u]))

    const leaderboard = topReferrers.map((r) => {
      const user = userMap.get(r.referrerId)
      return {
        name: user?.name ?? "Utente",
        referralCount: r._count.id,
        avatar: user?.image ?? null,
      }
    })

    return NextResponse.json(leaderboard)
  } catch (error) {
    console.error("Errore nel recupero classifica referral:", error)
    return NextResponse.json({ error: "Errore nel recupero della classifica" }, { status: 500 })
  }
}
