import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { LOYALTY_TYPE, REFERRAL_STATUS } from "@/lib/constants"
import { referralRedeemLimiter, getRateLimitResponse } from "@/lib/rate-limit"

const REFERRER_POINTS = 100
const REFERRED_POINTS = 50

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  const { success } = referralRedeemLimiter.check(5, session.user.id)
  if (!success) return getRateLimitResponse()

  let body: { code?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Corpo della richiesta non valido" }, { status: 400 })
  }

  const code = body.code?.trim().toUpperCase()
  if (!code) {
    return NextResponse.json({ error: "Codice referral obbligatorio" }, { status: 400 })
  }

  try {
    // Find the referrer by their referral code
    const referrer = await prisma.user.findUnique({
      where: { referralCode: code },
      select: { id: true },
    })

    if (!referrer) {
      return NextResponse.json({ error: "Codice referral non valido" }, { status: 404 })
    }

    // Cannot use own code
    if (referrer.id === session.user.id) {
      return NextResponse.json({ error: "Non puoi utilizzare il tuo stesso codice referral" }, { status: 400 })
    }

    // Check if user has already been referred
    const existingReferral = await prisma.referral.findFirst({
      where: { referredId: session.user.id, status: REFERRAL_STATUS.COMPLETED },
    })

    if (existingReferral) {
      return NextResponse.json({ error: "Hai già utilizzato un codice referral" }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create completed referral record
      const referral = await tx.referral.create({
        data: {
          referrerId: referrer.id,
          referredId: session.user.id,
          code,
          status: REFERRAL_STATUS.COMPLETED,
          rewardPoints: REFERRER_POINTS,
          completedAt: new Date(),
        },
      })

      // Award points to referrer
      await tx.loyaltyTransaction.create({
        data: {
          userId: referrer.id,
          points: REFERRER_POINTS,
          type: LOYALTY_TYPE.EARNED,
          reason: "Bonus referral - nuovo cliente invitato",
        },
      })
      await tx.user.update({
        where: { id: referrer.id },
        data: {
          loyaltyPoints: { increment: REFERRER_POINTS },
          totalPointsEarned: { increment: REFERRER_POINTS },
        },
      })

      // Award points to referred user
      await tx.loyaltyTransaction.create({
        data: {
          userId: session.user.id,
          points: REFERRED_POINTS,
          type: LOYALTY_TYPE.EARNED,
          reason: "Bonus referral - benvenuto tramite invito",
        },
      })
      await tx.user.update({
        where: { id: session.user.id },
        data: {
          loyaltyPoints: { increment: REFERRED_POINTS },
          totalPointsEarned: { increment: REFERRED_POINTS },
        },
      })

      return referral
    })

    return NextResponse.json({
      success: true,
      referralId: result.id,
      pointsAwarded: {
        referrer: REFERRER_POINTS,
        referred: REFERRED_POINTS,
      },
      message: `Codice riscattato! Hai ricevuto ${REFERRED_POINTS} punti fedeltà.`,
    })
  } catch (error) {
    console.error("Errore nel riscatto referral:", error)
    return NextResponse.json({ error: "Errore nel riscatto del codice referral" }, { status: 500 })
  }
}
