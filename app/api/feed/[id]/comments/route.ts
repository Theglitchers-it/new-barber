import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { feedCommentLimiter, getRateLimitResponse } from "@/lib/rate-limit"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params

  const post = await prisma.feedPost.findUnique({
    where: { id: postId, published: true },
  })
  if (!post) {
    return NextResponse.json({ error: "Post non trovato" }, { status: 404 })
  }

  const comments = await prisma.feedComment.findMany({
    where: { postId },
    orderBy: { createdAt: "asc" },
    include: {
      user: { select: { id: true, name: true, image: true } },
    },
  })

  return NextResponse.json(comments)
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  const { success } = feedCommentLimiter.check(15, session.user.id)
  if (!success) return getRateLimitResponse()

  const { id: postId } = await params

  const post = await prisma.feedPost.findUnique({
    where: { id: postId, published: true },
  })
  if (!post) {
    return NextResponse.json({ error: "Post non trovato" }, { status: 404 })
  }

  try {
    const body = await request.json()
    const { text } = body

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Il testo del commento è obbligatorio" },
        { status: 400 }
      )
    }

    if (text.trim().length > 500) {
      return NextResponse.json(
        { error: "Il commento non può superare i 500 caratteri" },
        { status: 400 }
      )
    }

    const comment = await prisma.feedComment.create({
      data: {
        userId: session.user.id,
        postId,
        text: text.trim(),
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    })

    return NextResponse.json(comment, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: "Errore nella creazione del commento" },
      { status: 500 }
    )
  }
}
