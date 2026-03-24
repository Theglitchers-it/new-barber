"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Clock,
  Users,
  Play,
  CheckCircle,
  XCircle,
  Loader2,
  MapPin,
  RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { WALKIN_STATUS } from "@/lib/constants"

interface QueueEntry {
  id: string
  customerName: string
  phone: string | null
  position: number
  estimatedWait: number
  status: string
  calledAt: string | null
  createdAt: string
  service: { name: string } | null
}

interface SalonStatus {
  isOpen: boolean
  totalChairs: number
  occupiedChairs: number
  queueLength: number
  estimatedWait: number
  queue: QueueEntry[]
}

export function WalkInAdminPage() {
  const [status, setStatus] = useState<SalonStatus | null>(null)
  const [allEntries, setAllEntries] = useState<QueueEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/walkin/status")
      if (res.ok) {
        const data = await res.json()
        setStatus(data)
        setAllEntries(data.queue || [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") fetchData()
    }, 10000)
    return () => clearInterval(interval)
  }, [fetchData])

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdating(id)
    try {
      const res = await fetch(`/api/walkin/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) await fetchData()
    } finally {
      setUpdating(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  const freeChairs = (status?.totalChairs || 0) - (status?.occupiedChairs || 0)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-heading font-bold">Gestione Walk-In</h1>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} className="gap-1">
          <RefreshCw className="w-3 h-3" /> Aggiorna
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="text-center p-3">
          <div className={cn("text-xl font-bold", status?.isOpen ? "text-green-500" : "text-red-500")}>
            {status?.isOpen ? "ON" : "OFF"}
          </div>
          <p className="text-[10px] text-muted-foreground">Stato</p>
        </Card>
        <Card className="text-center p-3">
          <div className="text-xl font-bold text-primary">{freeChairs}/{status?.totalChairs}</div>
          <p className="text-[10px] text-muted-foreground">Libere</p>
        </Card>
        <Card className="text-center p-3">
          <div className="text-xl font-bold text-amber-500">{status?.queueLength || 0}</div>
          <p className="text-[10px] text-muted-foreground">In Coda</p>
        </Card>
        <Card className="text-center p-3">
          <div className="text-xl font-bold text-muted-foreground">~{status?.estimatedWait || 0}m</div>
          <p className="text-[10px] text-muted-foreground">Attesa</p>
        </Card>
      </div>

      {/* Queue entries */}
      {allEntries.length > 0 ? (
        <Card>
          <CardContent className="p-0 divide-y divide-border/50">
            {allEntries.map(entry => (
              <div key={entry.id} className="p-4 flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0",
                  entry.status === WALKIN_STATUS.SERVING ? "bg-green-500/10 text-green-500" :
                  "bg-primary/10 text-primary"
                )}>
                  #{entry.position}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{entry.customerName}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    {entry.service && <span>{entry.service.name}</span>}
                    {entry.phone && <span>{entry.phone}</span>}
                    <span className="flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {new Date(entry.createdAt).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  {entry.status === WALKIN_STATUS.WAITING && (
                    <Button
                      size="sm"
                      onClick={() => updateStatus(entry.id, WALKIN_STATUS.SERVING)}
                      disabled={updating === entry.id}
                      className="h-8 gap-1 text-xs bg-green-500 hover:bg-green-600"
                    >
                      {updating === entry.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                      Chiama
                    </Button>
                  )}
                  {entry.status === WALKIN_STATUS.SERVING && (
                    <Button
                      size="sm"
                      onClick={() => updateStatus(entry.id, WALKIN_STATUS.COMPLETED)}
                      disabled={updating === entry.id}
                      className="h-8 gap-1 text-xs"
                    >
                      {updating === entry.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                      Fatto
                    </Button>
                  )}
                  {(entry.status === WALKIN_STATUS.WAITING || entry.status === WALKIN_STATUS.SERVING) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateStatus(entry.id, WALKIN_STATUS.LEFT)}
                      disabled={updating === entry.id}
                      className="h-8 gap-1 text-xs text-destructive hover:text-destructive"
                    >
                      <XCircle className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
            <p className="text-sm text-muted-foreground">Nessuno in coda</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
