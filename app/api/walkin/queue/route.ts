import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { recalculateQueuePositions } from "@/lib/walkin-utils"
import { WALKIN_STATUS } from "@/lib/constants"

// GET: Ottieni la posizione corrente dell'utente in coda
export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  try {
    const entry = await prisma.walkInQueue.findFirst({
      where: {
        userId: session.user.id,
        status: { in: [WALKIN_STATUS.WAITING, WALKIN_STATUS.SERVING] },
      },
      include: {
        service: { select: { name: true, duration: true, price: true } },
      },
    })

    if (!entry) {
      return NextResponse.json({ inQueue: false })
    }

    return NextResponse.json({ inQueue: true, entry })
  } catch (error) {
    console.error("Errore nel recupero della posizione in coda:", error)
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 }
    )
  }
}

// POST: Unisciti alla coda walk-in (auth opzionale)
export async function POST(request: Request) {
  const session = await auth()

  try {
    const body = await request.json()
    const { customerName, phone, serviceId } = body

    // Use provided name, or fall back to authenticated user's name
    const resolvedName = (customerName && typeof customerName === "string" && customerName.trim().length > 0)
      ? customerName.trim()
      : session?.user?.name?.trim() || null

    if (!resolvedName) {
      return NextResponse.json(
        { error: "Il nome del cliente è obbligatorio" },
        { status: 400 }
      )
    }

    // Se l'utente è autenticato, controlla che non sia già in coda
    if (session?.user) {
      const existing = await prisma.walkInQueue.findFirst({
        where: {
          userId: session.user.id,
          status: { in: [WALKIN_STATUS.WAITING, WALKIN_STATUS.SERVING] },
        },
      })
      if (existing) {
        return NextResponse.json(
          { error: "Sei già in coda" },
          { status: 409 }
        )
      }
    }

    // Valida il servizio se fornito
    if (serviceId) {
      const service = await prisma.service.findUnique({
        where: { id: serviceId },
      })
      if (!service) {
        return NextResponse.json(
          { error: "Servizio non trovato" },
          { status: 404 }
        )
      }
    }

    // Calcola la prossima posizione
    const lastEntry = await prisma.walkInQueue.findFirst({
      where: { status: WALKIN_STATUS.WAITING },
      orderBy: { position: "desc" },
    })
    const nextPosition = (lastEntry?.position ?? 0) + 1

    // Recupera slotDuration per il calcolo dell'attesa stimata
    const settings = await prisma.businessSettings.findFirst({
      where: { id: "default" },
    })
    const slotDuration = settings?.slotDuration ?? 30
    const estimatedWait = nextPosition * slotDuration

    const entry = await prisma.walkInQueue.create({
      data: {
        customerName: resolvedName,
        userId: session?.user?.id ?? null,
        phone: phone?.trim() || null,
        serviceId: serviceId || null,
        position: nextPosition,
        estimatedWait,
        status: WALKIN_STATUS.WAITING,
      },
      include: {
        service: { select: { name: true, duration: true, price: true } },
      },
    })

    return NextResponse.json(entry, { status: 201 })
  } catch (error) {
    console.error("Errore nell'aggiunta alla coda walk-in:", error)
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 }
    )
  }
}

// DELETE: Lascia la coda (rimuovi la propria entry)
export async function DELETE() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  try {
    const entry = await prisma.walkInQueue.findFirst({
      where: {
        userId: session.user.id,
        status: WALKIN_STATUS.WAITING,
      },
    })

    if (!entry) {
      return NextResponse.json(
        { error: "Non sei in coda" },
        { status: 404 }
      )
    }

    await prisma.walkInQueue.update({
      where: { id: entry.id },
      data: { status: WALKIN_STATUS.LEFT },
    })

    // Ricalcola le posizioni per le entry WAITING rimanenti
    await recalculateQueuePositions()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Errore nella rimozione dalla coda walk-in:", error)
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 }
    )
  }
}
