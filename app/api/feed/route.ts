import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { feedPostLimiter, getRateLimitResponse } from "@/lib/rate-limit"
import { USER_ROLE } from "@/lib/constants"

export async function GET(request: Request) {
  const session = await auth()

  const { searchParams } = new URL(request.url)
  const cursor = searchParams.get("cursor")
  const limitParam = searchParams.get("limit")
  const tag = searchParams.get("tag")
  const limit = Math.min(Math.max(parseInt(limitParam || "10"), 1), 50)

  const posts = await prisma.feedPost.findMany({
    where: {
      published: true,
      ...(tag ? { tags: { contains: tag } } : {}),
    },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: "desc" },
    include: {
      operator: { select: { id: true, name: true, image: true, role: true } },
      service: { select: { id: true, name: true } },
      ...(session?.user?.id
        ? {
            likes: {
              where: { userId: session.user.id },
              select: { id: true },
            },
            saves: {
              where: { userId: session.user.id },
              select: { id: true },
            },
          }
        : {}),
      _count: { select: { comments: true } },
    },
  })

  let nextCursor: string | undefined
  if (posts.length > limit) {
    const nextItem = posts.pop()
    nextCursor = nextItem?.id
  }

  const data = posts.map((post) => ({
    id: post.id,
    image: post.image,
    beforeImage: post.beforeImage,
    caption: post.caption,
    tags: post.tags,
    likesCount: post.likesCount,
    savesCount: post.savesCount,
    _count: { comments: post._count.comments },
    createdAt: post.createdAt,
    operator: post.operator,
    service: post.service,
    liked: session?.user?.id ? (post as any).likes?.length > 0 : false,
    saved: session?.user?.id ? (post as any).saves?.length > 0 : false,
  }))

  return NextResponse.json({ posts: data, nextCursor })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  if (session.user.role !== USER_ROLE.ADMIN) {
    return NextResponse.json({ error: "Accesso negato" }, { status: 403 })
  }

  const { success } = feedPostLimiter.check(10, session.user.id)
  if (!success) return getRateLimitResponse()

  try {
    const body = await request.json()
    const { image, beforeImage, caption, operatorId, serviceId, tags } = body

    if (!image || !operatorId) {
      return NextResponse.json(
        { error: "Immagine e operatore sono obbligatori" },
        { status: 400 }
      )
    }

    const operator = await prisma.operator.findUnique({
      where: { id: operatorId },
    })
    if (!operator) {
      return NextResponse.json(
        { error: "Operatore non trovato" },
        { status: 404 }
      )
    }

    if (serviceId) {
      const service = await prisma.service.findUnique({
        where: { id: serviceId },
      })
      if (!service) {
        return NextResponse.json(
          { error: "Servizio non trovato" },
          { status: 404 }
        )
      }
    }

    const post = await prisma.feedPost.create({
      data: {
        image,
        beforeImage: beforeImage || null,
        caption: caption || "",
        operatorId,
        serviceId: serviceId || null,
        tags: Array.isArray(tags) ? tags.join(",") : (tags || null),
        published: true,
      },
      include: {
        operator: { select: { id: true, name: true, image: true, role: true } },
        service: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(post, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: "Errore nella creazione del post" },
      { status: 500 }
    )
  }
}
