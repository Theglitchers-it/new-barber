"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Mail,
  Calendar,
  Loader2,
  AlertTriangle,
} from "lucide-react"
import Link from "next/link"
import { orderStatusLabels as statusLabels, orderStatusColors as statusColors, ORDER_STATUS } from "@/lib/constants"

const statusFlow: string[] = [ORDER_STATUS.PENDING, ORDER_STATUS.PROCESSING, ORDER_STATUS.SHIPPED, ORDER_STATUS.DELIVERED]

const statusIcons: Record<string, React.ElementType> = {
  [ORDER_STATUS.PENDING]: Clock,
  [ORDER_STATUS.PROCESSING]: Package,
  [ORDER_STATUS.SHIPPED]: Truck,
  [ORDER_STATUS.DELIVERED]: CheckCircle,
  [ORDER_STATUS.CANCELLED]: XCircle,
}

type Order = {
  id: string
  status: string
  total: number
  createdAt: string
  user: { name: string; email: string }
  items: {
    id: string
    quantity: number
    price: number
    product: { name: string; category: string }
  }[]
}

export default function OrderDetailPage() {
  const params = useParams()
  const { data: session } = useSession()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [updating, setUpdating] = useState(false)

  const isAdmin = session?.user?.role === "ADMIN"

  useEffect(() => {
    if (!params.id) return
    const controller = new AbortController()
    fetch(`/api/orders/${params.id}`, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error("Errore")
        return r.json()
      })
      .then((data) => { setOrder(data); setLoading(false) })
      .catch((err) => {
        if (err.name !== "AbortError") { setError(true); setLoading(false) }
      })
    return () => controller.abort()
  }, [params.id])

  const updateStatus = useCallback(async (status: string) => {
    const label = statusLabels[status] || status
    const action = status === ORDER_STATUS.CANCELLED ? "cancellare" : `segnare come "${label}"`
    if (!confirm(`Sei sicuro di voler ${action} questo ordine?`)) return

    setUpdating(true)
    try {
      const res = await fetch(`/api/orders/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || "Errore nell'aggiornamento")
        return
      }
      const updated = await res.json()
      setOrder((prev) => prev ? { ...prev, status: updated.status } : null)
      toast.success(`Stato aggiornato: ${statusLabels[updated.status] || updated.status}`)
    } catch {
      toast.error("Errore di connessione")
    } finally {
      setUpdating(false)
    }
  }, [params.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="text-center py-16">
        <AlertTriangle className="w-8 h-8 mx-auto text-muted-foreground/40 mb-3" />
        <p className="font-heading font-bold">{error ? "Errore nel caricamento" : "Ordine non trovato"}</p>
        <Link href="/ordini"><Button variant="ghost" className="mt-3"><ArrowLeft className="w-4 h-4 mr-2" /> Torna agli ordini</Button></Link>
      </div>
    )
  }

  const nextStatus = statusFlow[statusFlow.indexOf(order.status) + 1]
  const StatusIcon = statusIcons[order.status] || Package
  const isCancelled = order.status === ORDER_STATUS.CANCELLED
  const isDelivered = order.status === ORDER_STATUS.DELIVERED

  return (
    <div className="max-w-3xl mx-auto space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/ordini">
          <Button variant="ghost" size="icon" className="rounded-xl">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-heading font-extrabold">
            Ordine #{order.id.slice(-6).toUpperCase()}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {new Date(order.createdAt).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        </div>
        <Badge className={cn("text-xs gap-1", statusColors[order.status])}>
          <StatusIcon className="w-3 h-3" />
          {statusLabels[order.status]}
        </Badge>
      </div>

      {/* Progress Steps */}
      {!isCancelled && (
        <div className="flex items-center justify-between px-2">
          {statusFlow.map((s, i) => {
            const Icon = statusIcons[s] || Package
            const isCompleted = statusFlow.indexOf(order.status) >= i
            const isCurrent = order.status === s
            return (
              <div key={s} className="flex items-center gap-0 flex-1">
                <div className="flex flex-col items-center">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                    isCompleted ? "bg-primary text-white" : "bg-muted text-muted-foreground",
                    isCurrent && "ring-2 ring-primary/30 ring-offset-2 ring-offset-background"
                  )}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className={cn("text-[9px] mt-1 font-medium", isCompleted ? "text-foreground" : "text-muted-foreground")}>
                    {statusLabels[s]}
                  </span>
                </div>
                {i < statusFlow.length - 1 && (
                  <div className="flex-1 mx-1">
                    <div className="h-0.5 rounded-full bg-muted overflow-hidden">
                      <div className={cn("h-full bg-primary rounded-full transition-all duration-500", statusFlow.indexOf(order.status) > i ? "w-full" : "w-0")} />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {isCancelled && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-sm">
          <XCircle className="w-4 h-4 shrink-0" />
          Questo ordine è stato cancellato
        </div>
      )}

      {/* Info Cliente (solo admin) */}
      {isAdmin && order.user && (
        <Card className="glass border-0">
          <CardContent className="p-4">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-2">Cliente</p>
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10 border-2 border-primary/20">
                <AvatarFallback className="gradient-primary text-xs font-bold text-white">
                  {order.user.name?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">{order.user.name}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Mail className="w-3 h-3" /> {order.user.email}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prodotti */}
      <Card className="glass border-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-heading flex items-center gap-2">
            <Package className="w-4 h-4" /> Prodotti
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Prodotto</TableHead>
                <TableHead className="text-center">Qtà</TableHead>
                <TableHead className="text-right">Prezzo</TableHead>
                <TableHead className="text-right">Subtotale</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <p className="font-medium text-sm">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">{item.product.category}</p>
                  </TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-right text-sm">€{item.price.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-medium text-sm">
                    €{(item.price * item.quantity).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex justify-end p-4 border-t border-border/30">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Totale ordine</p>
              <p className="text-xl font-heading font-extrabold">€{order.total.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Azioni Admin */}
      {isAdmin && !isCancelled && !isDelivered && (
        <Card className="glass border-0">
          <CardContent className="p-4">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-3">Gestisci ordine</p>
            <div className="flex gap-2">
              {nextStatus && (
                <Button
                  onClick={() => updateStatus(nextStatus)}
                  disabled={updating}
                  className="gap-1.5 flex-1"
                >
                  {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Segna come: {statusLabels[nextStatus]}
                </Button>
              )}
              <Button
                variant="destructive"
                onClick={() => updateStatus(ORDER_STATUS.CANCELLED)}
                disabled={updating}
                className="gap-1.5"
              >
                <XCircle className="w-4 h-4" /> Cancella
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
