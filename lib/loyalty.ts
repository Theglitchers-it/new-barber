import { prisma } from "@/lib/prisma"
import { LOYALTY_TYPE, NOTIFICATION_TYPE, LOYALTY_TIER_CONFIG, calculateTier } from "@/lib/constants"

/**
 * Awards loyalty points to a user for a completed appointment or delivered order.
 * Applies tier multiplier, updates totalPointsEarned, and recalculates tier.
 */
export async function awardLoyaltyPoints({
  userId,
  amount,
  reason,
  appointmentId,
  orderId,
}: {
  userId: string
  amount: number
  reason: string
  appointmentId?: string
  orderId?: string
}) {
  // Check for existing award + fetch settings + user tier in parallel
  const [existingTx, settings, user] = await Promise.all([
    prisma.loyaltyTransaction.findFirst({
      where: {
        type: LOYALTY_TYPE.EARNED,
        ...(appointmentId ? { appointmentId } : {}),
        ...(orderId ? { orderId } : {}),
      },
    }),
    prisma.businessSettings.findUnique({ where: { id: "default" } }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { loyaltyTier: true, totalPointsEarned: true },
    }),
  ])

  if (existingTx || !user) return null

  const pointsPerEuro = settings?.loyaltyPointsPerEuro ?? 1
  const tierConfig = LOYALTY_TIER_CONFIG[user.loyaltyTier] || LOYALTY_TIER_CONFIG.BRONZE
  const multiplier = tierConfig.multiplier
  const earnedPoints = Math.round(amount * pointsPerEuro * multiplier)

  if (earnedPoints <= 0) return null

  const newTotalEarned = user.totalPointsEarned + earnedPoints
  const newTier = calculateTier(newTotalEarned)
  const tierChanged = newTier !== user.loyaltyTier

  const operations = [
    prisma.user.update({
      where: { id: userId },
      data: {
        loyaltyPoints: { increment: earnedPoints },
        totalPointsEarned: { increment: earnedPoints },
        totalSpent: { increment: amount },
        loyaltyTier: newTier,
        ...(appointmentId ? { lastVisit: new Date() } : {}),
      },
    }),
    prisma.loyaltyTransaction.create({
      data: {
        userId,
        points: earnedPoints,
        type: LOYALTY_TYPE.EARNED,
        reason: multiplier > 1 ? `${reason} (${multiplier}x ${tierConfig.label})` : reason,
        appointmentId: appointmentId ?? null,
        orderId: orderId ?? null,
      },
    }),
    prisma.notification.create({
      data: {
        userId,
        title: "Punti fedeltà guadagnati",
        message: multiplier > 1
          ? `Hai guadagnato ${earnedPoints} punti (${multiplier}x bonus ${tierConfig.label})!`
          : `Hai guadagnato ${earnedPoints} punti!`,
        type: NOTIFICATION_TYPE.LOYALTY,
        link: "/fedelta",
      },
    }),
  ]

  // Tier upgrade notification
  if (tierChanged) {
    const newTierConfig = LOYALTY_TIER_CONFIG[newTier]
    operations.push(
      prisma.notification.create({
        data: {
          userId,
          title: `Livello ${newTierConfig.label} sbloccato!`,
          message: `Congratulazioni! Sei salito al livello ${newTierConfig.label}. Ora guadagni ${newTierConfig.multiplier}x punti${newTierConfig.discount > 0 ? ` e hai ${Math.round(newTierConfig.discount * 100)}% di sconto` : ""}!`,
          type: NOTIFICATION_TYPE.LOYALTY,
          link: "/fedelta",
        },
      })
    )
  }

  await prisma.$transaction(operations)

  return { earnedPoints, tierChanged, newTier }
}
