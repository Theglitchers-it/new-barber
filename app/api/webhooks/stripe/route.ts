import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { stripe } from "@/lib/stripe"
import { awardLoyaltyPoints } from "@/lib/loyalty"
import { PAYMENT_STATUS, PACKAGE_STATUS } from "@/lib/constants"
import { sendEmail, isEmailEnabled } from "@/lib/email"
import { orderConfirmation } from "@/lib/email-templates"

export async function POST(request: Request) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 })
  }

  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object
      const orderId = session.metadata?.orderId
      const userId = session.metadata?.userId

      if (orderId) {
        // Idempotency guard: skip if already processed (Stripe may retry)
        const existing = await prisma.order.findUnique({ where: { id: orderId }, select: { paymentStatus: true } })
        if (existing?.paymentStatus === PAYMENT_STATUS.PAID) break

        await prisma.$transaction(async (tx) => {
          const order = await tx.order.update({
            where: { id: orderId },
            data: {
              status: "PROCESSING",
              paymentStatus: PAYMENT_STATUS.PAID,
              stripePaymentIntentId: session.payment_intent as string || null,
            },
            include: { items: true },
          })

          // Decrement stock (prevent negative)
          for (const item of order.items) {
            await tx.product.updateMany({
              where: { id: item.productId, stock: { gte: item.quantity } },
              data: { stock: { decrement: item.quantity } },
            })
          }

          // Clear cart
          if (userId) {
            await tx.cartItem.deleteMany({ where: { userId } })
          }

          // Increment coupon usage atomically (only on successful payment)
          const couponId = session.metadata?.couponId
          if (couponId) {
            await tx.coupon.update({
              where: { id: couponId },
              data: { usedCount: { increment: 1 } },
            })
          }
        })

        // Award loyalty + send email (outside transaction for non-critical)
        if (userId) {
          const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { user: { select: { email: true, name: true } }, items: { include: { product: { select: { name: true } } } } },
          })
          if (order) {
            await awardLoyaltyPoints({ userId, amount: order.total, reason: "Acquisto shop", orderId })
            if (isEmailEnabled() && order.user.email) {
              sendEmail({
                to: order.user.email,
                subject: "Ordine confermato!",
                html: orderConfirmation({
                  customerName: order.user.name || "Cliente",
                  orderId: order.id,
                  items: order.items.map((i) => ({ name: i.product.name, quantity: i.quantity, price: i.price })),
                  total: order.total,
                }),
              }).catch(() => {})
            }
          }
        }
      }

      // Handle package purchase fulfillment
      const packageId = session.metadata?.packageId
      const pkgType = session.metadata?.type
      if (packageId && pkgType === "package" && userId) {
        // Idempotency: check if already fulfilled
        const existingPkg = await prisma.userPackage.findFirst({
          where: { userId, packageId },
        })
        if (!existingPkg) {
          const pkg = await prisma.servicePackage.findUnique({ where: { id: packageId } })
          if (pkg) {
            const expiresAt = new Date()
            expiresAt.setDate(expiresAt.getDate() + pkg.validityDays)

            await prisma.userPackage.create({
              data: {
                userId,
                packageId,
                sessionsTotal: pkg.totalSessions,
                expiresAt,
                status: PACKAGE_STATUS.ACTIVE,
              },
            })

            await awardLoyaltyPoints({
              userId,
              amount: pkg.price,
              reason: `Acquisto pacchetto "${pkg.name}"`,
            })
          }
        }
      }
      break
    }

    case "payment_intent.succeeded": {
      const pi = event.data.object
      const appointmentId = pi.metadata?.appointmentId
      const type = pi.metadata?.type

      if (appointmentId) {
        const status = type === "deposit" ? PAYMENT_STATUS.DEPOSIT_PAID : PAYMENT_STATUS.PAID
        await prisma.appointment.update({
          where: { id: appointmentId },
          data: { paymentStatus: status, stripePaymentIntentId: pi.id },
        })
      }
      break
    }

    case "payment_intent.payment_failed": {
      const pi = event.data.object
      const appointmentId = pi.metadata?.appointmentId
      const orderId = pi.metadata?.orderId

      if (appointmentId) {
        await prisma.appointment.update({
          where: { id: appointmentId },
          data: { paymentStatus: PAYMENT_STATUS.FAILED },
        })
      }
      if (orderId) {
        await prisma.order.update({
          where: { id: orderId },
          data: { paymentStatus: PAYMENT_STATUS.FAILED },
        })
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
