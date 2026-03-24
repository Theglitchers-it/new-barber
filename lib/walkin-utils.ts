import { prisma } from "@/lib/prisma"
import { WALKIN_STATUS } from "@/lib/constants"

/**
 * Recalculate positions and estimated wait times for all WAITING entries.
 * Uses Promise.all to avoid N+1 sequential updates.
 */
export async function recalculateQueuePositions() {
  const [remainingEntries, settings] = await Promise.all([
    prisma.walkInQueue.findMany({
      where: { status: WALKIN_STATUS.WAITING },
      orderBy: { position: "asc" },
    }),
    prisma.businessSettings.findFirst({
      where: { id: "default" },
    }),
  ])

  const slotDuration = settings?.slotDuration ?? 30

  if (remainingEntries.length === 0) return

  await Promise.all(
    remainingEntries.map((entry, i) => {
      const newPosition = i + 1
      return prisma.walkInQueue.update({
        where: { id: entry.id },
        data: {
          position: newPosition,
          estimatedWait: newPosition * slotDuration,
        },
      })
    })
  )
}
