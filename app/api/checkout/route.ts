import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/api-utils"
import { stripe, isStripeEnabled } from "@/lib/stripe"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"

export async function POST(request: Request) {
  try {
    if (!isStripeEnabled() || !stripe) {
      return NextResponse.json({ error: "Pagamenti non configurati" }, { status: 503 })
    }

    const { session, error } = await requireAuth()
    if (error) return error

    const body = await request.json()
    const couponCode = (body as { couponCode?: string }).couponCode?.trim().toUpperCase()

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: session.user.id },
      include: { product: true },
    })

    if (cartItems.length === 0) {
      return NextResponse.json({ error: "Carrello vuoto" }, { status: 400 })
    }

    const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
    let discount = 0
    let couponId: string | null = null

    // Validate coupon (read-only, no increment — that happens in webhook on payment success)
    if (couponCode) {
      const coupon = await prisma.coupon.findFirst({
        where: { code: couponCode, active: true },
      })
      if (coupon && (!coupon.expiresAt || new Date(coupon.expiresAt) > new Date())) {
        if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
          return NextResponse.json({ error: "Coupon esaurito" }, { status: 400 })
        }
        if (coupon.minOrder && subtotal < coupon.minOrder) {
          return NextResponse.json({ error: `Ordine minimo €${coupon.minOrder}` }, { status: 400 })
        }
        discount = coupon.type === "PERCENTAGE"
          ? Math.round(subtotal * (coupon.value / 100) * 100) / 100
          : Math.min(coupon.value, subtotal)
        couponId = coupon.id
      }
    }

    const total = Math.max(0, subtotal - discount)

    // Create order in transaction
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        status: "PENDING",
        paymentStatus: "UNPAID",
        total,
        items: {
          create: cartItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price,
          })),
        },
      },
    })

    // Create Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [{
        price_data: {
          currency: "eur",
          product_data: {
            name: `Ordine SalonPro (${cartItems.length} articoli)`,
          },
          unit_amount: Math.round(total * 100),
        },
        quantity: 1,
      }],
      metadata: {
        orderId: order.id,
        userId: session.user.id,
        couponId: couponId || "",
      },
      success_url: `${BASE_URL}/ordini/${order.id}?success=true`,
      cancel_url: `${BASE_URL}/shop/carrello?cancelled=true`,
    })

    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: checkoutSession.id },
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error("Errore checkout:", error)
    return NextResponse.json({ error: "Errore nel checkout" }, { status: 500 })
  }
}
