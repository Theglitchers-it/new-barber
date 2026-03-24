import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import { orderStatusLabels as statusLabels, orderStatusColors as statusColors } from "@/lib/constants"

export default async function OrdiniPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const isAdmin = session.user.role === "ADMIN"
  const where = isAdmin ? {} : { userId: session.user.id }

  const orders = await prisma.order.findMany({
    where,
    include: {
      items: { include: { product: true } },
      user: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-extrabold">Ordini</h1>
        <p className="text-muted-foreground mt-1">
          {isAdmin ? "Gestisci tutti gli ordini" : "I tuoi ordini"}
        </p>
      </div>

      <Card className="glass border-0 shadow-lg">
        <CardContent className="p-0 overflow-x-auto">
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Nessun ordine trovato</p>
              <Link href="/shop">
                <Button>Vai allo Shop</Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ordine</TableHead>
                  <TableHead>Data</TableHead>
                  {isAdmin && <TableHead>Cliente</TableHead>}
                  <TableHead>Prodotti</TableHead>
                  <TableHead>Totale</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm">
                      #{order.id.slice(-6).toUpperCase()}
                    </TableCell>
                    <TableCell>
                      {new Date(order.createdAt).toLocaleDateString("it-IT", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    {isAdmin && <TableCell>{order.user.name}</TableCell>}
                    <TableCell>{order.items.length} articoli</TableCell>
                    <TableCell className="font-bold">€{order.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={statusColors[order.status]}>
                        {statusLabels[order.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link href={`/ordini/${order.id}`}>
                        <Button variant="ghost" size="sm">Dettagli</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
