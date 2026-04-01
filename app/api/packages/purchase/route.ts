import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, validationError } from "@/lib/api-utils"
import { PACKAGE_STATUS } from "@/lib/constants"
import { stripe, isStripeEnabled } from "@/lib/stripe"
import { z } from "zod"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"

const purchaseSchema = z.object({
  packageId: z.string().min(1, "Pacchetto obbligatorio"),
})

export async function POST(request: Request) {
  try {
    const { session, error } = await requireAuth()
    if (error) return error

    const body = await request.json()
    const parsed = purchaseSchema.safeParse(body)
    if (!parsed.success) return validationError(parsed)

    const pkg = await prisma.servicePackage.findUnique({
      where: { id: parsed.data.packageId },
      include: { items: { include: { service: { select: { name: true } } } } },
    })

    if (!pkg || !pkg.active) {
      return NextResponse.json({ error: "Pacchetto non disponibile" }, { status: 404 })
    }

    // Require Stripe for paid packages
    if (pkg.price > 0 && isStripeEnabled() && stripe) {
      const checkoutSession = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        line_items: [{
          price_data: {
            currency: "eur",
            product_data: {
              name: pkg.name,
              description: pkg.items.map((i) => `${i.quantity}x ${i.service.name}`).join(", "),
            },
            unit_amount: Math.round(pkg.price * 100),
          },
          quantity: 1,
        }],
        metadata: {
          packageId: pkg.id,
          userId: session.user.id,
          type: "package",
        },
        success_url: `${BASE_URL}/pacchetti?success=true`,
        cancel_url: `${BASE_URL}/pacchetti?cancelled=true`,
      })

      return NextResponse.json({ url: checkoutSession.url })
    }

    // Fallback for free packages or when Stripe is not configured
    if (pkg.price > 0 && !isStripeEnabled()) {
      return NextResponse.json({ error: "Pagamenti non configurati" }, { status: 503 })
    }

    // Free package — create directly
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + pkg.validityDays)

    const userPackage = await prisma.userPackage.create({
      data: {
        userId: session.user.id,
        packageId: pkg.id,
        sessionsTotal: pkg.totalSessions,
        expiresAt,
        status: PACKAGE_STATUS.ACTIVE,
      },
      include: { package: true },
    })

    return NextResponse.json(userPackage, { status: 201 })
  } catch (error) {
    console.error("Errore acquisto pacchetto:", error)
    return NextResponse.json({ error: "Errore nell'acquisto del pacchetto" }, { status: 500 })
  }
}
