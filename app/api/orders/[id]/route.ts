import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { awardLoyaltyPoints } from "@/lib/loyalty"
import { ORDER_STATUS, USER_ROLE } from "@/lib/constants"

const validStatuses = Object.values(ORDER_STATUS)

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  const { id } = await params
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: true } },
      user: { select: { id: true, name: true, email: true } },
    },
  })

  if (!order) {
    return NextResponse.json({ error: "Ordine non trovato" }, { status: 404 })
  }

  if (session.user.role !== USER_ROLE.ADMIN && order.userId !== session.user.id) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 })
  }

  return NextResponse.json(order)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || session.user.role !== USER_ROLE.ADMIN) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()
  const { status } = body

  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Stato non valido" }, { status: 400 })
  }

  // Award loyalty points when delivering
  if (status === ORDER_STATUS.DELIVERED) {
    const currentOrder = await prisma.order.findUnique({ where: { id } })
    if (currentOrder && currentOrder.status !== ORDER_STATUS.DELIVERED) {
      await awardLoyaltyPoints({
        userId: currentOrder.userId,
        amount: currentOrder.total,
        reason: "Ordine consegnato",
        orderId: id,
      })
    }
  }

  const order = await prisma.order.update({
    where: { id },
    data: { status },
    include: { items: { include: { product: true } } },
  })

  return NextResponse.json(order)
}
