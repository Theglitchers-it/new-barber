import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { USER_ROLE, WALKIN_STATUS } from "@/lib/constants"
import { recalculateQueuePositions } from "@/lib/walkin-utils"

// PATCH: Aggiorna lo stato di un'entry in coda (solo admin)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  if (session.user.role !== USER_ROLE.ADMIN) {
    return NextResponse.json(
      { error: "Accesso riservato agli amministratori" },
      { status: 403 }
    )
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { status } = body

    const validStatuses = [WALKIN_STATUS.SERVING, WALKIN_STATUS.COMPLETED, WALKIN_STATUS.LEFT]
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Stato non valido. Valori ammessi: SERVING, COMPLETED, LEFT" },
        { status: 400 }
      )
    }

    const entry = await prisma.walkInQueue.findUnique({ where: { id } })
    if (!entry) {
      return NextResponse.json(
        { error: "Entry non trovata" },
        { status: 404 }
      )
    }

    // Costruisci i dati di aggiornamento in base allo stato
    const updateData: Record<string, unknown> = { status }

    if (status === WALKIN_STATUS.SERVING) {
      updateData.calledAt = new Date()
    } else if (status === WALKIN_STATUS.COMPLETED) {
      updateData.completedAt = new Date()
    }

    const updated = await prisma.walkInQueue.update({
      where: { id },
      data: updateData,
      include: {
        service: { select: { name: true, duration: true, price: true } },
      },
    })

    // Ricalcola le posizioni per le entry WAITING rimanenti
    await recalculateQueuePositions()

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Errore nell'aggiornamento della coda walk-in:", error)
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 }
    )
  }
}
