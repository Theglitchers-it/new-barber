import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { USER_ROLE } from "@/lib/constants"
import { z } from "zod"

const createPortfolioSchema = z.object({
  operatorId: z.string().min(1),
  beforeImage: z.string().url().optional(),
  afterImage: z.string().min(1),
  caption: z.string().max(500).optional(),
  serviceId: z.string().optional(),
  published: z.boolean().optional(),
})

export async function GET(request: NextRequest) {
  const operatorId = request.nextUrl.searchParams.get("operatorId")
  if (!operatorId) {
    return NextResponse.json({ error: "operatorId richiesto" }, { status: 400 })
  }

  const session = await auth()
  const isAdmin = session?.user?.role === USER_ROLE.ADMIN

  const items = await prisma.operatorPortfolio.findMany({
    where: { operatorId, ...(isAdmin ? {} : { published: true }) },
    include: { service: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 20,
  })

  return NextResponse.json(items)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user || session.user.role !== USER_ROLE.ADMIN) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  let body
  try { body = await request.json() } catch {
    return NextResponse.json({ error: "JSON non valido" }, { status: 400 })
  }

  const parsed = createPortfolioSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const { operatorId, beforeImage, afterImage, caption, serviceId, published } = parsed.data

  const item = await prisma.operatorPortfolio.create({
    data: { operatorId, beforeImage, afterImage, caption, serviceId, published: published ?? false },
  })

  return NextResponse.json(item, { status: 201 })
}
