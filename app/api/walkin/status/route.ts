import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { USER_ROLE, WALKIN_STATUS } from "@/lib/constants"

export async function GET() {
  try {
    // Run all independent queries in parallel
    const [session, settings, servingEntries, waitingEntries] = await Promise.all([
      auth(),
      prisma.businessSettings.findFirst({ where: { id: "default" } }),
      prisma.walkInQueue.findMany({ where: { status: WALKIN_STATUS.SERVING } }),
      prisma.walkInQueue.findMany({
        where: { status: WALKIN_STATUS.WAITING },
        orderBy: { position: "asc" },
        include: { service: { select: { name: true } } },
      }),
    ])

    const isAdmin = session?.user?.role === USER_ROLE.ADMIN
    const openTime = settings?.openTime ?? "09:00"
    const closeTime = settings?.closeTime ?? "19:00"

    // Controlla se il salone è aperto in base all'orario corrente
    const now = new Date()
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
    const isOpen = currentTime >= openTime && currentTime < closeTime

    const totalChairs = 4
    const occupiedChairs = servingEntries.length
    const queueLength = waitingEntries.length

    // Stima attesa media basata sulla posizione in coda
    const estimatedWait = queueLength > 0
      ? Math.round(
          waitingEntries.reduce((sum, entry) => sum + entry.estimatedWait, 0) /
            queueLength
        )
      : 0

    // Redact customer names for non-admin users (PII protection)
    const queue = waitingEntries.map((entry) => ({
      id: isAdmin ? entry.id : undefined,
      customerName: isAdmin
        ? entry.customerName
        : (entry.customerName?.[0] ?? "?") + ".",
      position: entry.position,
      estimatedWait: entry.estimatedWait,
      serviceName: entry.service?.name ?? null,
    }))

    return NextResponse.json({
      isOpen,
      totalChairs,
      occupiedChairs,
      queueLength,
      estimatedWait,
      queue,
    })
  } catch (error) {
    console.error("Errore nel recupero dello stato walk-in:", error)
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 }
    )
  }
}
