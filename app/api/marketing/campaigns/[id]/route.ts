import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin, validationError } from "@/lib/api-utils"
import { runCampaigns } from "@/lib/marketing"
import { z } from "zod"

const updateCampaignSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(["BIRTHDAY", "INACTIVITY", "POST_VISIT", "TIER_UPGRADE", "SEASONAL"]).optional(),
  messageTitle: z.string().min(1).optional(),
  messageBody: z.string().min(1).optional(),
  triggerConfig: z.string().optional(),
  notificationType: z.string().optional(),
  enabled: z.boolean().optional(),
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { id } = await params
    const campaign = await prisma.marketingCampaign.findUnique({
      where: { id },
      include: { _count: { select: { messages: true } } },
    })
    if (!campaign) return NextResponse.json({ error: "Campagna non trovata" }, { status: 404 })
    return NextResponse.json(campaign)
  } catch {
    return NextResponse.json({ error: "Errore" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { id } = await params
    const body = await request.json()
    const parsed = updateCampaignSchema.safeParse(body)
    if (!parsed.success) return validationError(parsed)

    const campaign = await prisma.marketingCampaign.update({ where: { id }, data: parsed.data })
    return NextResponse.json(campaign)
  } catch (error) {
    console.error("Errore aggiornamento campagna:", error)
    return NextResponse.json({ error: "Errore nell'aggiornamento" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { id } = await params
    await prisma.marketingCampaign.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Errore eliminazione campagna:", error)
    return NextResponse.json({ error: "Errore nell'eliminazione" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { id } = await params
    const results = await runCampaigns(id)
    return NextResponse.json({ results })
  } catch (error) {
    console.error("Errore esecuzione campagna:", error)
    return NextResponse.json({ error: "Errore nell'esecuzione" }, { status: 500 })
  }
}
