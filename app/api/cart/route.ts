import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { addToCartSchema } from "@/lib/validations/cart"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  const items = await prisma.cartItem.findMany({
    where: { userId: session.user.id },
    include: { product: true },
  })

  return NextResponse.json(items)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  const body = await request.json()
  const parsed = addToCartSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const { productId, quantity } = parsed.data

  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product || !product.active) {
    return NextResponse.json({ error: "Prodotto non trovato" }, { status: 404 })
  }

  const item = await prisma.cartItem.upsert({
    where: {
      userId_productId: {
        userId: session.user.id,
        productId,
      },
    },
    update: { quantity: { increment: quantity } },
    create: {
      userId: session.user.id,
      productId,
      quantity,
    },
    include: { product: true },
  })

  return NextResponse.json(item, { status: 201 })
}
