import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/api-utils"
import { runCampaigns } from "@/lib/marketing"

export async function POST(request: NextRequest) {
  try {
    // Auth: admin session OR cron secret
    const cronSecret = request.headers.get("x-cron-secret")
    if (cronSecret && cronSecret === process.env.CRON_SECRET) {
      const results = await runCampaigns()
      return NextResponse.json({ results })
    }

    const { error } = await requireAdmin()
    if (error) return error

    const body = await request.json().catch(() => ({}))
    const campaignId = (body as { campaignId?: string }).campaignId
    const results = await runCampaigns(campaignId || undefined)

    return NextResponse.json({ results })
  } catch (error) {
    console.error("Errore esecuzione campagne:", error)
    return NextResponse.json({ error: "Errore nell'esecuzione delle campagne" }, { status: 500 })
  }
}
