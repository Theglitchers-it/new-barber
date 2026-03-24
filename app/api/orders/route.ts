import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { ORDER_STATUS } from "@/lib/constants"
import { orderLimiter, getRateLimitResponse } from "@/lib/rate-limit"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  const where = session.user.role === "ADMIN" ? {} : { userId: session.user.id }

  const orders = await prisma.order.findMany({
    where,
    include: {
      items: { include: { product: true } },
      user: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(orders)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  const { success } = orderLimiter.check(5, session.user.id)
  if (!success) return getRateLimitResponse()

  let couponCode: string | undefined
  try {
    const body = await request.json()
    couponCode = typeof body.couponCode === "string" ? body.couponCode.trim().toUpperCase() : undefined
  } catch {
    // No body or invalid JSON — proceed without coupon
  }

  const cartItems = await prisma.cartItem.findMany({
    where: { userId: session.user.id },
    include: { product: true },
  })

  if (cartItems.length === 0) {
    return NextResponse.json({ error: "Il carrello è vuoto" }, { status: 400 })
  }

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  )

  try {
    const order = await prisma.$transaction(async (tx) => {
      // Validate coupon inside transaction
      let discount = 0

      if (couponCode) {
        const coupon = await tx.coupon.findUnique({ where: { code: couponCode } })

        if (!coupon || !coupon.active) {
          throw new Error("Coupon non valido o non attivo")
        }
        if (coupon.expiresAt && coupon.expiresAt < new Date()) {
          throw new Error("Coupon scaduto")
        }
        if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
          throw new Error("Coupon esaurito")
        }
        if (subtotal < coupon.minOrder) {
          throw new Error(`Ordine minimo €${coupon.minOrder} per questo coupon`)
        }

        discount = coupon.type === "PERCENTAGE"
          ? Math.round(subtotal * (coupon.value / 100) * 100) / 100
          : Math.min(coupon.value, subtotal)

        await tx.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } },
        })
      }

      const total = Math.max(0, subtotal - discount)

      // Re-check stock inside transaction
      for (const item of cartItems) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { stock: true, name: true },
        })
        if (!product || product.stock < item.quantity) {
          throw new Error(`Stock insufficiente per ${product?.name ?? item.productId}`)
        }
      }

      const newOrder = await tx.order.create({
        data: {
          userId: session.user.id,
          total,
          status: ORDER_STATUS.PENDING,
          items: {
            create: cartItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price,
            })),
          },
        },
        include: { items: { include: { product: true } } },
      })

      for (const item of cartItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        })
      }

      await tx.cartItem.deleteMany({
        where: { userId: session.user.id },
      })

      return newOrder
    })

    return NextResponse.json(order, { status: 201 })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Errore nella creazione dell'ordine"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
