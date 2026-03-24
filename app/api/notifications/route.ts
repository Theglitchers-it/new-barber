import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { markNotificationsSchema } from "@/lib/validations/api"

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const unread = searchParams.get("unread")

  if (unread === "true") {
    const count = await prisma.notification.count({
      where: { userId: session.user.id, read: false },
    })
    return NextResponse.json({ count })
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return NextResponse.json(notifications)
}

export async function PATCH(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  const body = await request.json()
  const parsed = markNotificationsSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }
  const { ids } = parsed.data

  await prisma.notification.updateMany({
    where: {
      id: { in: ids },
      userId: session.user.id,
    },
    data: { read: true },
  })

  return NextResponse.json({ success: true })
}
