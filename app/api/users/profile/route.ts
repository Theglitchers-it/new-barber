import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { hashSync, compareSync } from "bcryptjs"
import { profileUpdateSchema, passwordChangeSchema } from "@/lib/validations/auth"
import { passwordChangeLimiter, getRateLimitResponse } from "@/lib/rate-limit"

const profileSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  hairType: true,
  preferredContact: true,
  notes: true,
  loyaltyPoints: true,
} as const

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: profileSelect,
  })

  return NextResponse.json(user)
}

export async function PATCH(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  const body = await request.json()

  // Cambio password
  if (body.currentPassword || body.newPassword) {
    // Rate limiting per userId
    const { success } = passwordChangeLimiter.check(3, session.user.id)
    if (!success) return getRateLimitResponse()

    const parsed = passwordChangeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { hashedPassword: true },
    })

    if (!user?.hashedPassword) {
      return NextResponse.json({ error: "Password non configurata" }, { status: 400 })
    }

    const isValid = compareSync(parsed.data.currentPassword, user.hashedPassword)
    if (!isValid) {
      return NextResponse.json({ error: "Password attuale non corretta" }, { status: 400 })
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { hashedPassword: hashSync(parsed.data.newPassword, 12) },
    })

    return NextResponse.json({ success: true, message: "Password aggiornata" })
  }

  // Aggiornamento profilo
  const parsed = profileUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: parsed.data,
    select: profileSelect,
  })

  return NextResponse.json(updated)
}
