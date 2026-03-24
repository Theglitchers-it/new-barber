import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Users, Calendar, Gift, TrendingUp } from "lucide-react"
import { ClientiSearch } from "./clienti-search"
import { USER_ROLE } from "@/lib/constants"
import { cn } from "@/lib/utils"

export default async function ClientiPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string; order?: string }>
}) {
  const session = await auth()
  if (!session?.user || session.user.role !== USER_ROLE.ADMIN) redirect("/dashboard")

  const { q, sort = "createdAt", order = "desc" } = await searchParams

  const clientRole = USER_ROLE.CLIENT
  const where = q
    ? {
        role: clientRole,
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { email: { contains: q, mode: "insensitive" as const } },
          { phone: { contains: q } },
        ],
      }
    : { role: clientRole }

  const validSorts = ["createdAt", "name", "loyaltyPoints"] as const
  const sortField = validSorts.includes(sort as typeof validSorts[number]) ? sort : "createdAt"
  const sortOrder = order === "asc" ? "asc" : "desc"

  const [clients, totalClients, thisMonthClients, totalPoints] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        loyaltyPoints: true,
        createdAt: true,
        _count: { select: { appointments: true, orders: true } },
      },
      orderBy: { [sortField]: sortOrder },
      take: 100,
    }),
    prisma.user.count({ where: { role: USER_ROLE.CLIENT } }),
    prisma.user.count({
      where: {
        role: USER_ROLE.CLIENT,
        createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
    }),
    prisma.user.aggregate({
      where: { role: USER_ROLE.CLIENT },
      _sum: { loyaltyPoints: true },
    }),
  ])

  const stats = [
    { label: "Totale Clienti", value: totalClients, icon: Users, color: "text-primary" },
    { label: "Nuovi questo mese", value: thisMonthClients, icon: TrendingUp, color: "text-green-500" },
    { label: "Punti Fedeltà Totali", value: totalPoints._sum.loyaltyPoints || 0, icon: Gift, color: "text-amber-500" },
  ]

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-extrabold">Clienti</h1>
          <p className="text-muted-foreground mt-1">{clients.length} clienti{q ? ` trovati per "${q}"` : " registrati"}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="glass border-0">
            <CardContent className="flex items-center gap-3 p-4">
              <div className={cn("w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center", stat.color)}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-heading font-extrabold">{stat.value.toLocaleString("it-IT")}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <ClientiSearch defaultQuery={q || ""} currentSort={sortField} currentOrder={sortOrder} />

      {/* Table */}
      <Card className="glass border-0 shadow-lg">
        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-[700px]">
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead className="hidden sm:table-cell">Telefono</TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Prenot.
                  </div>
                </TableHead>
                <TableHead className="text-center">Ordini</TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Gift className="w-3.5 h-3.5" />
                    Punti
                  </div>
                </TableHead>
                <TableHead className="hidden md:table-cell">Registrato</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id} className="hover:bg-accent/5 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-9 h-9 border-2 border-primary/20">
                        <AvatarFallback className="gradient-primary text-xs font-bold text-white">
                          {client.name?.[0]?.toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{client.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{client.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {client.phone || "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="text-xs">
                      {client._count.appointments}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="text-xs">
                      {client._count.orders}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center font-semibold text-primary">
                    {client.loyaltyPoints}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {new Date(client.createdAt).toLocaleDateString("it-IT")}
                  </TableCell>
                  <TableCell>
                    <Link href={`/clienti/${client.id}`}>
                      <Button variant="ghost" size="sm" className="text-xs">Dettagli</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {clients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    {q ? "Nessun cliente trovato" : "Nessun cliente registrato"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
