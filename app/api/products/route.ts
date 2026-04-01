import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { productSchema } from "@/lib/validations/settings"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get("category")
  const search = searchParams.get("search")

  const where: Record<string, unknown> = {}
  if (category && category.length <= 100 && /^[\w\s\-àèéìòù]+$/i.test(category)) where.category = category
  if (search && search.length <= 100) where.name = { contains: search, mode: "insensitive" }

  const products = await prisma.product.findMany({
    where,
    orderBy: { name: "asc" },
  })

  return NextResponse.json(products, {
    headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=120" },
  })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 })
  }

  const body = await request.json()
  const parsed = productSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    )
  }

  const product = await prisma.product.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      category: parsed.data.category,
      price: parsed.data.price,
      originalPrice: parsed.data.originalPrice ?? null,
      stock: parsed.data.stock ?? 0,
      image: parsed.data.image || null,
      active: parsed.data.active ?? true,
    },
  })

  return NextResponse.json(product, { status: 201 })
}
