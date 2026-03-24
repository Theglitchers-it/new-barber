import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 })
  }

  const topClients = await prisma.user.findMany({
    where: { role: "CLIENT" },
    select: {
      id: true,
      name: true,
      loyaltyPoints: true,
      totalSpent: true,
    },
    orderBy: { loyaltyPoints: "desc" },
    take: 10,
  })

  return NextResponse.json(topClients)
}
