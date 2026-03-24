import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { feedSaveLimiter, getRateLimitResponse } from "@/lib/rate-limit"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  const { success } = feedSaveLimiter.check(30, session.user.id)
  if (!success) return getRateLimitResponse()

  const { id: postId } = await params

  const post = await prisma.feedPost.findUnique({
    where: { id: postId, published: true },
  })
  if (!post) {
    return NextResponse.json({ error: "Post non trovato" }, { status: 404 })
  }

  const existingSave = await prisma.feedSave.findUnique({
    where: { userId_postId: { userId: session.user.id, postId } },
  })

  if (existingSave) {
    await prisma.$transaction([
      prisma.feedSave.delete({ where: { id: existingSave.id } }),
      prisma.feedPost.update({
        where: { id: postId },
        data: { savesCount: { decrement: 1 } },
      }),
    ])

    const updated = await prisma.feedPost.findUnique({
      where: { id: postId },
      select: { savesCount: true },
    })

    return NextResponse.json({
      saved: false,
      savesCount: updated?.savesCount ?? 0,
    })
  } else {
    await prisma.$transaction([
      prisma.feedSave.create({
        data: { userId: session.user.id, postId },
      }),
      prisma.feedPost.update({
        where: { id: postId },
        data: { savesCount: { increment: 1 } },
      }),
    ])

    const updated = await prisma.feedPost.findUnique({
      where: { id: postId },
      select: { savesCount: true },
    })

    return NextResponse.json({
      saved: true,
      savesCount: updated?.savesCount ?? 0,
    })
  }
}
