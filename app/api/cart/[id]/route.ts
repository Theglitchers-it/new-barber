import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { updateCartSchema } from "@/lib/validations/cart"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()
  const parsed = updateCartSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  // IDOR fix: userId nel WHERE per evitare accesso a carrelli altrui
  const item = await prisma.cartItem.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!item) {
    return NextResponse.json({ error: "Non trovato" }, { status: 404 })
  }

  const updated = await prisma.cartItem.update({
    where: { id: item.id },
    data: { quantity: parsed.data.quantity },
    include: { product: true },
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  const { id } = await params

  // IDOR fix: userId nel WHERE
  const item = await prisma.cartItem.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!item) {
    return NextResponse.json({ error: "Non trovato" }, { status: 404 })
  }

  await prisma.cartItem.delete({ where: { id: item.id } })

  return NextResponse.json({ success: true })
}
