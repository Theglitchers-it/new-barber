import { prisma } from "@/lib/prisma"
import { CAMPAIGN_TYPE, NOTIFICATION_TYPE } from "@/lib/constants"
import { sendEmail, isEmailEnabled } from "@/lib/email"
import { campaignEmail } from "@/lib/email-templates"

function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] || `{${key}}`)
}

interface Campaign {
  id: string
  name: string
  type: string
  triggerConfig: string | null
  messageTitle: string
  messageBody: string
  notificationType: string
}

interface CampaignResult {
  campaignId: string
  campaignName: string
  messagesSent: number
}

/** Fetch user IDs that already received a message for this campaign since `since`. */
async function getAlreadySentUserIds(campaignId: string, userIds: string[], since: Date): Promise<Set<string>> {
  const sent = await prisma.marketingMessage.findMany({
    where: { campaignId, userId: { in: userIds }, sentAt: { gte: since } },
    select: { userId: true },
  })
  return new Set(sent.map((m) => m.userId))
}

export async function runCampaigns(campaignId?: string): Promise<CampaignResult[]> {
  const where = campaignId ? { id: campaignId, enabled: true } : { enabled: true }
  const campaigns = await prisma.marketingCampaign.findMany({ where })
  const results: CampaignResult[] = []

  for (const campaign of campaigns) {
    let sent = 0
    try {
      switch (campaign.type) {
        case CAMPAIGN_TYPE.BIRTHDAY:
          sent = await handleBirthday(campaign)
          break
        case CAMPAIGN_TYPE.INACTIVITY:
          sent = await handleInactivity(campaign)
          break
        case CAMPAIGN_TYPE.POST_VISIT:
          sent = await handlePostVisit(campaign)
          break
        case CAMPAIGN_TYPE.SEASONAL:
          sent = await handleSeasonal(campaign)
          break
      }
      await prisma.marketingCampaign.update({
        where: { id: campaign.id },
        data: { lastRunAt: new Date() },
      })
    } catch (error) {
      console.error(`Errore campagna ${campaign.name}:`, error)
    }
    results.push({ campaignId: campaign.id, campaignName: campaign.name, messagesSent: sent })
  }

  return results
}

async function handleBirthday(campaign: Campaign): Promise<number> {
  const today = new Date()
  const month = today.getMonth() + 1
  const day = today.getDate()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())

  const users = await prisma.user.findMany({
    where: { role: "CLIENT", birthDate: { not: null } },
    select: { id: true, name: true, birthDate: true },
  })

  const birthdayUsers = users.filter((u) => {
    if (!u.birthDate) return false
    const bd = new Date(u.birthDate)
    return bd.getMonth() + 1 === month && bd.getDate() === day
  })

  if (birthdayUsers.length === 0) return 0

  const alreadySent = await getAlreadySentUserIds(
    campaign.id,
    birthdayUsers.map((u) => u.id),
    todayStart
  )

  let sent = 0
  for (const user of birthdayUsers) {
    if (alreadySent.has(user.id)) continue
    await sendCampaignMessage(campaign, user.id, { name: user.name || "Cliente" })
    sent++
  }
  return sent
}

async function handleInactivity(campaign: Campaign): Promise<number> {
  const config = campaign.triggerConfig ? JSON.parse(campaign.triggerConfig) : {}
  const inactivityDays = config.inactivityDays || 30
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - inactivityDays)

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const users = await prisma.user.findMany({
    where: {
      role: "CLIENT",
      OR: [{ lastVisit: { lt: cutoff } }, { lastVisit: null }],
    },
    select: { id: true, name: true, lastVisit: true },
  })

  if (users.length === 0) return 0

  const alreadySent = await getAlreadySentUserIds(
    campaign.id,
    users.map((u) => u.id),
    sevenDaysAgo
  )

  let sent = 0
  for (const user of users) {
    if (alreadySent.has(user.id)) continue
    const daysSince = user.lastVisit
      ? Math.floor((Date.now() - user.lastVisit.getTime()) / (1000 * 60 * 60 * 24))
      : inactivityDays
    await sendCampaignMessage(campaign, user.id, {
      name: user.name || "Cliente",
      days: String(daysSince),
    })
    sent++
  }
  return sent
}

async function handlePostVisit(campaign: Campaign): Promise<number> {
  const config = campaign.triggerConfig ? JSON.parse(campaign.triggerConfig) : {}
  const delayHours = config.delayHours || 24

  const now = new Date()
  const windowEnd = new Date(now.getTime() - delayHours * 60 * 60 * 1000)
  const windowStart = new Date(windowEnd.getTime() - 60 * 60 * 1000)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const appointments = await prisma.appointment.findMany({
    where: {
      status: "COMPLETED",
      updatedAt: { gte: windowStart, lt: windowEnd },
      review: null,
    },
    include: {
      user: { select: { id: true, name: true } },
      service: { select: { name: true } },
    },
  })

  if (appointments.length === 0) return 0

  // Batch duplicate check — scoped to last 7 days (not lifetime)
  const userIds = [...new Set(appointments.map((a) => a.userId))]
  const alreadySent = await getAlreadySentUserIds(campaign.id, userIds, sevenDaysAgo)

  let sent = 0
  for (const apt of appointments) {
    if (alreadySent.has(apt.userId)) continue
    await sendCampaignMessage(campaign, apt.userId, {
      name: apt.user.name || "Cliente",
      service: apt.service.name,
    })
    alreadySent.add(apt.userId) // prevent duplicate within same batch
    sent++
  }
  return sent
}

async function handleSeasonal(campaign: Campaign): Promise<number> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const users = await prisma.user.findMany({
    where: { role: "CLIENT" },
    select: { id: true, name: true },
  })

  if (users.length === 0) return 0

  const alreadySent = await getAlreadySentUserIds(
    campaign.id,
    users.map((u) => u.id),
    today
  )

  let sent = 0
  for (const user of users) {
    if (alreadySent.has(user.id)) continue
    await sendCampaignMessage(campaign, user.id, { name: user.name || "Cliente" })
    sent++
  }
  return sent
}

async function sendCampaignMessage(campaign: Campaign, userId: string, vars: Record<string, string>) {
  const title = renderTemplate(campaign.messageTitle, vars)
  const message = renderTemplate(campaign.messageBody, vars)

  await prisma.$transaction(async (tx) => {
    const notification = await tx.notification.create({
      data: {
        userId,
        title,
        message,
        type: campaign.notificationType || NOTIFICATION_TYPE.SYSTEM,
        link: "/notifiche",
      },
    })

    await tx.marketingMessage.create({
      data: {
        campaignId: campaign.id,
        userId,
        notificationId: notification.id,
        status: "SENT",
      },
    })

    // Send email alongside in-app notification
    if (isEmailEnabled()) {
      const user = await tx.user.findUnique({ where: { id: userId }, select: { email: true } })
      if (user?.email) {
        sendEmail({ to: user.email, subject: title, html: campaignEmail({ title, message }) }).catch(() => {})
      }
    }
  })
}
