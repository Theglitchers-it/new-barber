import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin, validationError } from "@/lib/api-utils"
import { z } from "zod"

const createPackageSchema = z.object({
  name: z.string().min(1, "Nome obbligatorio"),
  description: z.string().optional(),
  price: z.number().positive("Il prezzo deve essere positivo"),
  originalPrice: z.number().positive("Il prezzo originale deve essere positivo"),
  totalSessions: z.number().int().min(1, "Minimo 1 sessione"),
  validityDays: z.number().int().min(1, "Minimo 1 giorno di validità"),
  items: z.array(z.object({
    serviceId: z.string().min(1),
    quantity: z.number().int().min(1).default(1),
  })).min(1, "Almeno un servizio"),
})

export async function GET() {
  try {
    const packages = await prisma.servicePackage.findMany({
      where: { active: true },
      include: {
        items: { include: { service: { select: { id: true, name: true, price: true, duration: true } } } },
      },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(packages, {
      headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=120" },
    })
  } catch {
    return NextResponse.json({ error: "Errore nel recupero pacchetti" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const body = await request.json()
    const parsed = createPackageSchema.safeParse(body)
    if (!parsed.success) return validationError(parsed)

    const { items, ...packageData } = parsed.data

    const pkg = await prisma.$transaction(async (tx) => {
      const created = await tx.servicePackage.create({
        data: packageData,
      })

      await tx.servicePackageItem.createMany({
        data: items.map((item) => ({
          packageId: created.id,
          serviceId: item.serviceId,
          quantity: item.quantity,
        })),
      })

      return tx.servicePackage.findUnique({
        where: { id: created.id },
        include: {
          items: { include: { service: { select: { id: true, name: true, price: true, duration: true } } } },
        },
      })
    })

    return NextResponse.json(pkg, { status: 201 })
  } catch (error) {
    console.error("Errore creazione pacchetto:", error)
    return NextResponse.json({ error: "Errore nella creazione del pacchetto" }, { status: 500 })
  }
}
