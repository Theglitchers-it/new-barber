import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { businessSettingsSchema } from "@/lib/validations/settings"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  let settings = await prisma.businessSettings.findUnique({
    where: { id: "default" },
  })

  if (!settings) {
    settings = await prisma.businessSettings.create({
      data: { id: "default" },
    })
  }

  return NextResponse.json(settings)
}

export async function PUT(request: Request) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 })
  }

  const body = await request.json()
  const parsed = businessSettingsSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const settings = await prisma.businessSettings.upsert({
    where: { id: "default" },
    update: parsed.data,
    create: { id: "default", ...parsed.data },
  })

  return NextResponse.json(settings)
}
