import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const items = await prisma.operatorPortfolio.findMany({
    where: { published: true },
    include: {
      operator: { select: { name: true, image: true } },
      service: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  })

  return NextResponse.json(items)
}
