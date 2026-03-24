import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"

const createTimelineSchema = z.object({
  appointmentId: z.string().optional(),
  beforePhoto: z.string().max(2000).optional(),
  afterPhoto: z.string().max(2000).optional(),
  service: z.string().min(1, "Servizio obbligatorio").max(200),
  operator: z.string().min(1, "Operatore obbligatorio").max(200),
  notes: z.string().max(1000).optional(),
  colorFormula: z.string().max(500).optional(),
  productsUsed: z.string().max(500).optional(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  const entries = await prisma.hairTimelineEntry.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return NextResponse.json(entries)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  let body
  try { body = await request.json() } catch {
    return NextResponse.json({ error: "JSON non valido" }, { status: 400 })
  }

  const parsed = createTimelineSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const entry = await prisma.hairTimelineEntry.create({
    data: { userId: session.user.id, ...parsed.data },
  })

  return NextResponse.json(entry, { status: 201 })
}
