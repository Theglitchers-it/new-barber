import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/api-utils"
import { z } from "zod"

const onboardingSchema = z.object({
  salon: z.object({
    salonName: z.string().min(1),
    address: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    openTime: z.string().default("09:00"),
    closeTime: z.string().default("19:00"),
  }),
  services: z.array(z.object({
    name: z.string().min(1),
    price: z.number().positive(),
    duration: z.number().int().min(5),
    category: z.string().min(1),
  })).min(1),
  operators: z.array(z.object({
    name: z.string().min(1),
    role: z.string().default("Stylist"),
  })).optional(),
})

export async function POST(request: Request) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const body = await request.json()
    const parsed = onboardingSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { salon, services, operators } = parsed.data

    await prisma.$transaction(async (tx) => {
      // Upsert business settings
      await tx.businessSettings.upsert({
        where: { id: "default" },
        update: { ...salon, onboardingCompleted: true },
        create: { id: "default", ...salon, onboardingCompleted: true },
      })

      // Create services
      for (const svc of services) {
        await tx.service.create({
          data: { ...svc, active: true },
        })
      }

      // Create operators with default weekly availability
      if (operators && operators.length > 0) {
        for (const op of operators) {
          const operator = await tx.operator.create({
            data: { name: op.name, role: op.role, active: true },
          })

          // Default availability: Mon-Sat, same as salon hours
          const days = [1, 2, 3, 4, 5, 6] // Lun-Sab
          await tx.operatorAvailability.createMany({
            data: days.map((day) => ({
              operatorId: operator.id,
              dayOfWeek: day,
              startTime: salon.openTime,
              endTime: salon.closeTime,
            })),
          })
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Errore onboarding:", error)
    return NextResponse.json({ error: "Errore nella configurazione" }, { status: 500 })
  }
}
