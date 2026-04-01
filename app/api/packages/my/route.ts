import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/api-utils"
import { PACKAGE_STATUS } from "@/lib/constants"

export async function GET() {
  try {
    const { session, error } = await requireAuth()
    if (error) return error

    await prisma.userPackage.updateMany({
      where: {
        userId: session.user.id,
        status: PACKAGE_STATUS.ACTIVE,
        expiresAt: { lt: new Date() },
      },
      data: { status: PACKAGE_STATUS.EXPIRED },
    })

    const userPackages = await prisma.userPackage.findMany({
      where: { userId: session.user.id },
      include: {
        package: {
          include: {
            items: {
              include: { service: { select: { id: true, name: true, price: true, duration: true } } },
            },
          },
        },
      },
      orderBy: { purchasedAt: "desc" },
    })

    return NextResponse.json(userPackages)
  } catch {
    return NextResponse.json({ error: "Errore nel recupero pacchetti" }, { status: 500 })
  }
}
