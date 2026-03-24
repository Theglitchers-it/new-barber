import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  const now = new Date()

  // Active challenges
  const challenges = await prisma.challenge.findMany({
    where: { active: true, endDate: { gte: now } },
    orderBy: { endDate: "asc" },
  })

  // User's progress on these challenges
  const userChallenges = await prisma.userChallenge.findMany({
    where: {
      userId: session.user.id,
      challengeId: { in: challenges.map((c) => c.id) },
    },
  })

  const progressMap = new Map(userChallenges.map((uc) => [uc.challengeId, uc]))

  const result = challenges.map((c) => {
    const uc = progressMap.get(c.id)
    return {
      ...c,
      progress: uc?.progress || 0,
      completed: uc?.completed || false,
      completedAt: uc?.completedAt || null,
    }
  })

  // User streak info
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { currentStreak: true, longestStreak: true },
  })

  return NextResponse.json({
    challenges: result,
    streak: {
      current: user?.currentStreak || 0,
      longest: user?.longestStreak || 0,
    },
  })
}
