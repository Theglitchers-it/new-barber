import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { REFERRAL_STATUS, LOYALTY_TYPE } from "@/lib/constants"

function generateReferralCode(name: string | null | undefined): string {
  const prefix = (name || "USER").split(" ")[0].toUpperCase().slice(0, 8)
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let suffix = ""
  for (let i = 0; i < 4; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)]
  }
  return `${prefix}${suffix}`
}

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  try {
    let user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { referralCode: true, name: true },
    })

    if (!user) {
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 })
    }

    // Auto-generate referral code if missing
    if (!user.referralCode) {
      let code = generateReferralCode(user.name)
      // Ensure uniqueness
      let attempts = 0
      while (attempts < 10) {
        const existing = await prisma.user.findUnique({ where: { referralCode: code } })
        if (!existing) break
        code = generateReferralCode(user.name)
        attempts++
      }
      if (attempts >= 10) {
        return NextResponse.json({ error: "Errore nella generazione del codice referral" }, { status: 500 })
      }

      user = await prisma.user.update({
        where: { id: session.user.id },
        data: { referralCode: code },
        select: { referralCode: true, name: true },
      })
    }

    const [referrals, completedCount, pointsAgg] = await Promise.all([
      prisma.referral.findMany({
        where: { referrerId: session.user.id },
        orderBy: { createdAt: "desc" },
        include: {
          referred: { select: { name: true, email: true } },
        },
      }),
      prisma.referral.count({
        where: { referrerId: session.user.id, status: REFERRAL_STATUS.COMPLETED },
      }),
      prisma.loyaltyTransaction.aggregate({
        where: {
          userId: session.user.id,
          type: LOYALTY_TYPE.EARNED,
          reason: { contains: "referral" },
        },
        _sum: { points: true },
      }),
    ])

    return NextResponse.json({
      referralCode: user.referralCode,
      stats: {
        total: referrals.length,
        completed: completedCount,
        pointsEarned: pointsAgg._sum.points ?? 0,
      },
      referrals: referrals.map((r) => ({
        id: r.id,
        referredName: r.referred?.name ?? null,
        referredEmail: r.referred?.email ?? null,
        status: r.status,
        rewardPoints: r.rewardPoints,
        createdAt: r.createdAt,
        completedAt: r.completedAt,
      })),
    })
  } catch (error) {
    console.error("Errore nel recupero referral:", error)
    return NextResponse.json({ error: "Errore nel recupero delle informazioni referral" }, { status: 500 })
  }
}
