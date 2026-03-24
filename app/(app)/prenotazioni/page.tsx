import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { PrenotazioniClient } from "./prenotazioni-client"
import { USER_ROLE } from "@/lib/constants"

export default async function PrenotazioniPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const isAdmin = session.user.role === USER_ROLE.ADMIN
  const where = isAdmin ? {} : { userId: session.user.id }

  const appointments = await prisma.appointment.findMany({
    where,
    include: {
      service: { select: { name: true } },
      operator: { select: { name: true } },
      user: { select: { name: true } },
    },
    orderBy: { date: "desc" },
  })

  const serialized = appointments.map((a) => ({
    id: a.id,
    date: a.date.toISOString(),
    startTime: a.startTime,
    endTime: a.endTime,
    status: a.status,
    totalPrice: a.totalPrice,
    service: a.service,
    operator: a.operator,
    user: a.user,
  }))

  return <PrenotazioniClient initialAppointments={serialized} isAdmin={isAdmin} />
}
