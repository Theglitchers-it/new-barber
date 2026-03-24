import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { reviewLimiter, getRateLimitResponse } from "@/lib/rate-limit"
import { APPOINTMENT_STATUS } from "@/lib/constants"
import { createReviewSchema } from "@/lib/validations/api"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  const { success } = reviewLimiter.check(5, session.user.id)
  if (!success) return getRateLimitResponse()

  const { id } = await params
  const body = await request.json()
  const parsed = createReviewSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }
  const { rating, comment } = parsed.data

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: { review: true, service: true },
  })

  if (!appointment) {
    return NextResponse.json({ error: "Appuntamento non trovato" }, { status: 404 })
  }

  if (appointment.userId !== session.user.id) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 })
  }

  if (appointment.status !== APPOINTMENT_STATUS.COMPLETED) {
    return NextResponse.json({ error: "L'appuntamento deve essere completato" }, { status: 400 })
  }

  if (appointment.review) {
    return NextResponse.json({ error: "Recensione già presente" }, { status: 409 })
  }

  // Crea la recensione e aggiorna l'operatore in una transazione
  const operator = await prisma.operator.findUnique({
    where: { id: appointment.operatorId },
  })

  if (!operator) {
    return NextResponse.json({ error: "Operatore non trovato" }, { status: 404 })
  }

  const newReviewCount = operator.reviewCount + 1
  const newRating =
    (operator.rating * operator.reviewCount + rating) / newReviewCount

  // Punti fedeltà per recensione
  const loyaltyPoints = 10

  const [review] = await prisma.$transaction([
    prisma.review.create({
      data: {
        userId: session.user.id,
        operatorId: appointment.operatorId,
        appointmentId: id,
        rating,
        comment: comment ?? null,
      },
    }),
    prisma.operator.update({
      where: { id: appointment.operatorId },
      data: {
        rating: Math.round(newRating * 10) / 10,
        reviewCount: newReviewCount,
      },
    }),
    prisma.user.update({
      where: { id: session.user.id },
      data: { loyaltyPoints: { increment: loyaltyPoints } },
    }),
    prisma.loyaltyTransaction.create({
      data: {
        userId: session.user.id,
        points: loyaltyPoints,
        type: "EARNED",
        reason: "Recensione appuntamento",
        appointmentId: id,
      },
    }),
    prisma.notification.create({
      data: {
        userId: session.user.id,
        title: "Punti fedeltà guadagnati",
        message: `Hai guadagnato ${loyaltyPoints} punti per la tua recensione!`,
        type: "LOYALTY",
        link: "/fedelta",
      },
    }),
  ])

  return NextResponse.json(review, { status: 201 })
}
