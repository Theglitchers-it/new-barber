import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { couponSchema } from "@/lib/validations/settings"

const couponUpdateSchema = couponSchema.partial()

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()
  const parsed = couponUpdateSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const coupon = await prisma.coupon.findUnique({ where: { id } })
  if (!coupon) {
    return NextResponse.json({ error: "Coupon non trovato" }, { status: 404 })
  }

  const data: Record<string, unknown> = {}
  if (parsed.data.code !== undefined) data.code = parsed.data.code.toUpperCase()
  if (parsed.data.type !== undefined) data.type = parsed.data.type
  if (parsed.data.value !== undefined) data.value = parsed.data.value
  if (parsed.data.minOrder !== undefined) data.minOrder = parsed.data.minOrder
  if (parsed.data.maxUses !== undefined) data.maxUses = parsed.data.maxUses
  if (parsed.data.expiresAt !== undefined) data.expiresAt = parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null
  if (parsed.data.active !== undefined) data.active = parsed.data.active

  const updated = await prisma.coupon.update({
    where: { id },
    data,
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 })
  }

  const { id } = await params

  const coupon = await prisma.coupon.findUnique({ where: { id } })
  if (!coupon) {
    return NextResponse.json({ error: "Coupon non trovato" }, { status: 404 })
  }

  await prisma.coupon.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
