import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin, validationError } from "@/lib/api-utils"
import { z } from "zod"

const createCampaignSchema = z.object({
  name: z.string().min(1, "Nome obbligatorio"),
  type: z.enum(["BIRTHDAY", "INACTIVITY", "POST_VISIT", "TIER_UPGRADE", "SEASONAL"]),
  messageTitle: z.string().min(1, "Titolo obbligatorio"),
  messageBody: z.string().min(1, "Messaggio obbligatorio"),
  triggerConfig: z.string().optional().refine((val) => {
    if (!val) return true
    try { JSON.parse(val); return true } catch { return false }
  }, "Config JSON non valido"),
  notificationType: z.enum(["APPOINTMENT", "ORDER", "LOYALTY", "SYSTEM"]).default("SYSTEM"),
})

export async function GET() {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const campaigns = await prisma.marketingCampaign.findMany({
      include: { _count: { select: { messages: true } } },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(campaigns)
  } catch {
    return NextResponse.json({ error: "Errore nel recupero campagne" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const body = await request.json()
    const parsed = createCampaignSchema.safeParse(body)
    if (!parsed.success) return validationError(parsed)

    const campaign = await prisma.marketingCampaign.create({ data: parsed.data })
    return NextResponse.json(campaign, { status: 201 })
  } catch (error) {
    console.error("Errore creazione campagna:", error)
    return NextResponse.json({ error: "Errore nella creazione della campagna" }, { status: 500 })
  }
}
