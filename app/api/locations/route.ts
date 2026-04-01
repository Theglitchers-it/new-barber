import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin, validationError } from "@/lib/api-utils"
import { z } from "zod"

const createLocationSchema = z.object({
  name: z.string().min(1, "Nome obbligatorio"),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  openTime: z.string().default("09:00"),
  closeTime: z.string().default("19:00"),
  slotDuration: z.number().int().min(10).default(30),
})

export async function GET() {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const locations = await prisma.location.findMany({
      where: { active: true },
      include: { _count: { select: { operators: true, appointments: true } } },
      orderBy: { name: "asc" },
    })
    return NextResponse.json(locations)
  } catch {
    return NextResponse.json({ error: "Errore nel recupero sedi" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const body = await request.json()
    const parsed = createLocationSchema.safeParse(body)
    if (!parsed.success) return validationError(parsed)

    const location = await prisma.location.create({ data: parsed.data })
    return NextResponse.json(location, { status: 201 })
  } catch (error) {
    console.error("Errore creazione sede:", error)
    return NextResponse.json({ error: "Errore nella creazione della sede" }, { status: 500 })
  }
}
