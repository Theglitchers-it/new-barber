import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { StarRating } from "@/components/ui/star-rating"
import { ArrowLeft, Calendar, Mail, Phone, Gift, Star, Euro, Heart } from "lucide-react"
import Link from "next/link"
import { appointmentStatusLabels as statusLabels, appointmentStatusColors as statusColors, APPOINTMENT_STATUS, orderStatusLabels } from "@/lib/constants"

export default async function ClienteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") redirect("/dashboard")

  const { id } = await params
  const client = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      loyaltyPoints: true,
      createdAt: true,
      role: true,
      appointments: {
        include: { service: true, operator: true },
        orderBy: { date: "desc" },
        take: 20,
      },
      orders: {
        include: { items: { include: { product: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      reviews: {
        include: { operator: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      loyaltyTransactions: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  })

  if (!client) notFound()

  const completedAppointments = client.appointments.filter(a => a.status === APPOINTMENT_STATUS.COMPLETED)
  const totalRevenue = completedAppointments.reduce((sum, a) => sum + a.totalPrice, 0)

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link href="/clienti">
          <Button variant="ghost" size="icon" className="rounded-xl">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-4">
          <Avatar className="w-14 h-14 border-2 border-primary/20">
            <AvatarFallback className="text-lg bg-gradient-to-br from-primary/20 to-accent font-semibold text-primary">
              {client.name?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-extrabold">{client.name}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-1">
              <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {client.email}</span>
              {client.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {client.phone}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 stagger-children">
        <Card className="glass border-0">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xl font-bold">{completedAppointments.length}</p>
              <p className="text-xs text-muted-foreground">Visite</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-0">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Euro className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xl font-bold">€{totalRevenue.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">Totale Speso</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-0">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Gift className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xl font-bold">{client.loyaltyPoints}</p>
              <p className="text-xs text-muted-foreground">Punti Fedeltà</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-0">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Star className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-xl font-bold">{client.reviews.length}</p>
              <p className="text-xs text-muted-foreground">Recensioni</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preferences */}
      {(client.hairType || client.preferredContact || client.notes) && (
        <Card className="glass border-0">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Heart className="w-4 h-4" /> Preferenze
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {client.hairType && (
                <div>
                  <p className="text-xs text-muted-foreground">Tipo di Capelli</p>
                  <p className="text-sm font-medium">{client.hairType}</p>
                </div>
              )}
              {client.preferredContact && (
                <div>
                  <p className="text-xs text-muted-foreground">Contatto Preferito</p>
                  <p className="text-sm font-medium">{client.preferredContact}</p>
                </div>
              )}
              {client.notes && (
                <div className="md:col-span-3">
                  <p className="text-xs text-muted-foreground">Note</p>
                  <p className="text-sm">{client.notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="prenotazioni">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="prenotazioni">Prenotazioni</TabsTrigger>
          <TabsTrigger value="ordini">Ordini</TabsTrigger>
          <TabsTrigger value="recensioni">Recensioni</TabsTrigger>
          <TabsTrigger value="fedelta">Fedeltà</TabsTrigger>
        </TabsList>

        <TabsContent value="prenotazioni">
          <Card className="glass border-0">
            <CardContent className="p-0">
              {client.appointments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nessuna prenotazione</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Servizio</TableHead>
                      <TableHead className="hidden md:table-cell">Operatore</TableHead>
                      <TableHead>Prezzo</TableHead>
                      <TableHead>Stato</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {client.appointments.map((apt) => (
                      <TableRow key={apt.id}>
                        <TableCell className="text-sm">
                          {new Date(apt.date).toLocaleDateString("it-IT")} {apt.startTime}
                        </TableCell>
                        <TableCell className="text-sm">{apt.service.name}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm">{apt.operator.name}</TableCell>
                        <TableCell className="text-sm font-medium">€{apt.totalPrice}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`text-xs ${statusColors[apt.status]}`}>
                            {statusLabels[apt.status]}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ordini">
          <Card className="glass border-0">
            <CardContent className="p-0">
              {client.orders.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nessun ordine</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Articoli</TableHead>
                      <TableHead>Totale</TableHead>
                      <TableHead>Stato</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {client.orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="text-sm">
                          {new Date(order.createdAt).toLocaleDateString("it-IT")}
                        </TableCell>
                        <TableCell className="text-sm">
                          {order.items.map(i => i.product.name).join(", ")}
                        </TableCell>
                        <TableCell className="text-sm font-medium">€{order.total.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">{orderStatusLabels[order.status] || order.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recensioni">
          <div className="space-y-3">
            {client.reviews.length === 0 ? (
              <Card className="glass border-0">
                <CardContent className="py-8 text-center text-muted-foreground">
                  Nessuna recensione
                </CardContent>
              </Card>
            ) : (
              client.reviews.map((review) => (
                <Card key={review.id} className="glass border-0">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <StarRating rating={review.rating} size="sm" />
                        <span className="text-sm font-medium">per {review.operator.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString("it-IT")}
                      </span>
                    </div>
                    {review.comment && <p className="text-sm">{review.comment}</p>}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="fedelta">
          <Card className="glass border-0">
            <CardHeader>
              <CardTitle className="text-base">Storico Punti Fedeltà</CardTitle>
            </CardHeader>
            <CardContent>
              {client.loyaltyTransactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">Nessuna transazione</p>
              ) : (
                <div className="space-y-3">
                  {client.loyaltyTransactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                      <div>
                        <p className="text-sm font-medium">{tx.reason}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.createdAt).toLocaleDateString("it-IT")}
                        </p>
                      </div>
                      <span className={`text-sm font-bold ${tx.points > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                        {tx.points > 0 ? "+" : ""}{tx.points} pt
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
