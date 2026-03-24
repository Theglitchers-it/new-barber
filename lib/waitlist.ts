import { prisma } from "@/lib/prisma"
import { NOTIFICATION_TYPE, WAITLIST_STATUS } from "@/lib/constants"

/**
 * Checks the waitlist for a given date and notifies the first waiting user.
 * Called after an appointment cancellation.
 */
export async function checkWaitlist(date: Date, serviceId: string) {
  const entry = await prisma.waitlistEntry.findFirst({
    where: {
      date,
      serviceId,
      status: WAITLIST_STATUS.WAITING,
    },
    orderBy: { createdAt: "asc" },
    include: { service: { select: { name: true } } },
  })

  if (!entry) return null

  await Promise.all([
    prisma.waitlistEntry.update({
      where: { id: entry.id },
      data: { status: WAITLIST_STATUS.NOTIFIED, notifiedAt: new Date() },
    }),
    prisma.notification.create({
      data: {
        userId: entry.userId,
        title: "Posto disponibile!",
        message: `Si è liberato uno slot per ${entry.service.name} il ${date.toLocaleDateString("it-IT", { day: "numeric", month: "long" })}. Prenota ora prima che scada!`,
        type: NOTIFICATION_TYPE.APPOINTMENT,
        link: "/prenotazioni/nuova",
      },
    }),
  ])

  return entry
}
