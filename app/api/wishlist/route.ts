import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

const CUID_RE = /^c[a-z0-9]{20,}$/i
function isValidProductId(id: unknown): id is string {
  return typeof id === "string" && CUID_RE.test(id)
}

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  const items = await prisma.wishlist.findMany({
    where: { userId: session.user.id },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          price: true,
          originalPrice: true,
          image: true,
          rating: true,
          stock: true,
          active: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(items)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  const { productId } = await request.json()
  if (!isValidProductId(productId)) {
    return NextResponse.json({ error: "productId richiesto" }, { status: 400 })
  }

  const item = await prisma.wishlist.upsert({
    where: {
      userId_productId: { userId: session.user.id, productId },
    },
    update: {},
    create: { userId: session.user.id, productId },
  })

  return NextResponse.json(item, { status: 201 })
}

export async function DELETE(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  const { productId } = await request.json()
  if (!isValidProductId(productId)) {
    return NextResponse.json({ error: "productId richiesto" }, { status: 400 })
  }

  await prisma.wishlist.deleteMany({
    where: { userId: session.user.id, productId },
  })

  return NextResponse.json({ success: true })
}
