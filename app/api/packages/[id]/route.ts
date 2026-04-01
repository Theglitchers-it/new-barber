import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin, validationError } from "@/lib/api-utils"
import { z } from "zod"

const updatePackageSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  originalPrice: z.number().positive().optional(),
  totalSessions: z.number().int().min(1).optional(),
  validityDays: z.number().int().min(1).optional(),
  active: z.boolean().optional(),
  items: z.array(z.object({
    serviceId: z.string().min(1),
    quantity: z.number().int().min(1).default(1),
  })).optional(),
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const pkg = await prisma.servicePackage.findUnique({
      where: { id },
      include: {
        items: { include: { service: { select: { id: true, name: true, price: true, duration: true } } } },
      },
    })
    if (!pkg) return NextResponse.json({ error: "Pacchetto non trovato" }, { status: 404 })
    return NextResponse.json(pkg)
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
    const parsed = updatePackageSchema.safeParse(body)
    if (!parsed.success) return validationError(parsed)

    const { items, ...packageData } = parsed.data

    const pkg = await prisma.$transaction(async (tx) => {
      await tx.servicePackage.update({ where: { id }, data: packageData })
      if (items) {
        await tx.servicePackageItem.deleteMany({ where: { packageId: id } })
        await tx.servicePackageItem.createMany({
          data: items.map((item) => ({ packageId: id, serviceId: item.serviceId, quantity: item.quantity })),
        })
      }
      return tx.servicePackage.findUnique({
        where: { id },
        include: { items: { include: { service: { select: { id: true, name: true, price: true, duration: true } } } } },
      })
    })

    return NextResponse.json(pkg)
  } catch (error) {
    console.error("Errore aggiornamento pacchetto:", error)
    return NextResponse.json({ error: "Errore nell'aggiornamento" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { id } = await params
    await prisma.servicePackage.update({ where: { id }, data: { active: false } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Errore eliminazione pacchetto:", error)
    return NextResponse.json({ error: "Errore nell'eliminazione" }, { status: 500 })
  }
}
