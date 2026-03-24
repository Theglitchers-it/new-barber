import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { couponSchema } from "@/lib/validations/settings"

export async function GET() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 })
  }

  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(coupons)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 })
  }

  const body = await request.json()
  const parsed = couponSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const existing = await prisma.coupon.findUnique({ where: { code: parsed.data.code.toUpperCase() } })
  if (existing) {
    return NextResponse.json({ error: "Codice già esistente" }, { status: 409 })
  }

  const coupon = await prisma.coupon.create({
    data: {
      code: parsed.data.code.toUpperCase(),
      type: parsed.data.type,
      value: parsed.data.value,
      minOrder: parsed.data.minOrder ?? 0,
      maxUses: parsed.data.maxUses ?? null,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
    },
  })

  return NextResponse.json(coupon, { status: 201 })
}
