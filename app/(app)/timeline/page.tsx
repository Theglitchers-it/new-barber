import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { HairTimeline } from "@/components/client/hair-timeline"
import { Scissors } from "lucide-react"

export default async function TimelinePage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const entries = await prisma.hairTimelineEntry.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  const serialized = entries.map((e) => ({
    ...e,
    createdAt: e.createdAt.toISOString(),
  }))

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-extrabold flex items-center gap-2">
          <Scissors className="w-6 h-6 text-primary" />
          I Miei Capelli
        </h1>
        <p className="text-muted-foreground mt-1">La tua evoluzione nel tempo</p>
      </div>

      <HairTimeline entries={serialized} />
    </div>
  )
}
