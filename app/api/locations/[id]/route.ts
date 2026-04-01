import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin, validationError } from "@/lib/api-utils"
import { z } from "zod"

const updateLocationSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  openTime: z.string().optional(),
  closeTime: z.string().optional(),
  slotDuration: z.number().int().min(10).optional(),
  active: z.boolean().optional(),
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { id } = await params
    const location = await prisma.location.findUnique({
      where: { id },
      include: {
        operators: { include: { operator: { select: { id: true, name: true, role: true, image: true } } } },
        _count: { select: { appointments: true } },
      },
    })
    if (!location) return NextResponse.json({ error: "Sede non trovata" }, { status: 404 })
    return NextResponse.json(location)
  } catch {
    return NextResponse.json({ error: "Errore" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { id } = await params
    const body = await request.json()
    const parsed = updateLocationSchema.safeParse(body)
    if (!parsed.success) return validationError(parsed)

    const location = await prisma.location.update({ where: { id }, data: parsed.data })
    return NextResponse.json(location)
  } catch (error) {
    console.error("Errore aggiornamento sede:", error)
    return NextResponse.json({ error: "Errore nell'aggiornamento" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { id } = await params
    await prisma.location.update({ where: { id }, data: { active: false } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Errore eliminazione sede:", error)
    return NextResponse.json({ error: "Errore nell'eliminazione" }, { status: 500 })
  }
}
