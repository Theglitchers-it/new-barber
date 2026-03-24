import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { feedLikeLimiter, getRateLimitResponse } from "@/lib/rate-limit"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  const { success } = feedLikeLimiter.check(30, session.user.id)
  if (!success) return getRateLimitResponse()

  const { id: postId } = await params

  const post = await prisma.feedPost.findUnique({
    where: { id: postId, published: true },
  })
  if (!post) {
    return NextResponse.json({ error: "Post non trovato" }, { status: 404 })
  }

  const existingLike = await prisma.feedLike.findUnique({
    where: { userId_postId: { userId: session.user.id, postId } },
  })

  if (existingLike) {
    await prisma.$transaction([
      prisma.feedLike.delete({ where: { id: existingLike.id } }),
      prisma.feedPost.update({
        where: { id: postId },
        data: { likesCount: { decrement: 1 } },
      }),
    ])

    const updated = await prisma.feedPost.findUnique({
      where: { id: postId },
      select: { likesCount: true },
    })

    return NextResponse.json({
      liked: false,
      likesCount: updated?.likesCount ?? 0,
    })
  } else {
    await prisma.$transaction([
      prisma.feedLike.create({
        data: { userId: session.user.id, postId },
      }),
      prisma.feedPost.update({
        where: { id: postId },
        data: { likesCount: { increment: 1 } },
      }),
    ])

    const updated = await prisma.feedPost.findUnique({
      where: { id: postId },
      select: { likesCount: true },
    })

    return NextResponse.json({
      liked: true,
      likesCount: updated?.likesCount ?? 0,
    })
  }
}
