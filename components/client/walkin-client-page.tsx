"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Clock,
  Users,
  MapPin,
  Loader2,
  CheckCircle,
  AlertCircle,
  UserPlus,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { WALKIN_STATUS } from "@/lib/constants"

interface SalonStatus {
  isOpen: boolean
  totalChairs: number
  occupiedChairs: number
  queueLength: number
  estimatedWait: number
  queue: Array<{
    id: string
    customerName: string
    position: number
    estimatedWait: number
    service: string | null
  }>
}

interface QueueEntry {
  id: string
  customerName: string
  position: number
  estimatedWait: number
  status: string
  service: { name: string } | null
}

export function WalkInClientPage({ userId }: { userId: string }) {
  const [status, setStatus] = useState<SalonStatus | null>(null)
  const [myEntry, setMyEntry] = useState<QueueEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [leaving, setLeaving] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [statusRes, queueRes] = await Promise.all([
        fetch("/api/walkin/status"),
        fetch("/api/walkin/queue"),
      ])
      if (statusRes.ok) setStatus(await statusRes.json())
      if (queueRes.ok) {
        const data = await queueRes.json()
        setMyEntry(data.entry || null)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(() => {
      // Only poll when tab is visible
      if (document.visibilityState === "visible") fetchData()
    }, 15000)
    return () => clearInterval(interval)
  }, [fetchData])

  const joinQueue = async () => {
    setJoining(true)
    try {
      const res = await fetch("/api/walkin/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerName: "" }), // Server will use user's name
      })
      if (res.ok) {
        await fetchData()
      }
    } finally {
      setJoining(false)
    }
  }

  const leaveQueue = async () => {
    setLeaving(true)
    try {
      const res = await fetch("/api/walkin/queue", { method: "DELETE" })
      if (res.ok) {
        setMyEntry(null)
        await fetchData()
      }
    } finally {
      setLeaving(false)
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
  // occupancy derived when needed: (status.occupiedChairs / status.totalChairs) * 100

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <MapPin className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-heading font-bold">Stato Salone</h1>
      </div>

      {/* Open/Closed Status */}
      <Card className={cn("overflow-hidden border-0", status?.isOpen ? "bg-green-500/10" : "bg-red-500/10")}>
        <CardContent className="p-4 flex items-center gap-3">
          <div className={cn(
            "w-3 h-3 rounded-full animate-pulse",
            status?.isOpen ? "bg-green-500" : "bg-red-500"
          )} />
          <span className={cn("font-heading font-bold", status?.isOpen ? "text-green-500" : "text-red-500")}>
            {status?.isOpen ? "Aperto Ora" : "Chiuso"}
          </span>
        </CardContent>
      </Card>

      {/* Real-time stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center p-3">
          <div className={cn(
            "text-2xl font-heading font-bold",
            freeChairs > 1 ? "text-green-500" : freeChairs === 1 ? "text-amber-500" : "text-red-500"
          )}>
            {freeChairs}
          </div>
          <p className="text-[10px] text-muted-foreground font-medium">Sedie Libere</p>
        </Card>
        <Card className="text-center p-3">
          <div className="text-2xl font-heading font-bold text-primary">{status?.queueLength || 0}</div>
          <p className="text-[10px] text-muted-foreground font-medium">In Coda</p>
        </Card>
        <Card className="text-center p-3">
          <div className="text-2xl font-heading font-bold text-amber-500">~{status?.estimatedWait || 0}m</div>
          <p className="text-[10px] text-muted-foreground font-medium">Attesa</p>
        </Card>
      </div>

      {/* Chair occupancy bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Occupazione sedie</span>
            <span className="text-xs font-bold">{status?.occupiedChairs}/{status?.totalChairs}</span>
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden flex gap-0.5">
            {Array.from({ length: status?.totalChairs || 4 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "flex-1 rounded-full transition-colors duration-500",
                  i < (status?.occupiedChairs || 0) ? "bg-primary" : "bg-muted-foreground/20"
                )}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* My Queue Entry or Join Button */}
      {myEntry ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold">Sei in coda!</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={leaveQueue}
                disabled={leaving}
                className="text-destructive hover:text-destructive h-8"
              >
                {leaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <><X className="w-3 h-3 mr-1" /> Esci</>}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-3xl font-heading font-black text-primary">#{myEntry.position}</p>
                <p className="text-[10px] text-muted-foreground">Posizione</p>
              </div>
              <div>
                <p className="text-3xl font-heading font-black text-amber-500">~{myEntry.estimatedWait}m</p>
                <p className="text-[10px] text-muted-foreground">Attesa stimata</p>
              </div>
            </div>
            {myEntry.status === WALKIN_STATUS.SERVING && (
              <div className="mt-3 p-2 rounded-xl bg-green-500/10 text-center">
                <p className="text-sm font-bold text-green-500">Tocca a te! Accomodati alla sedia.</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : status?.isOpen ? (
        <Button
          onClick={joinQueue}
          disabled={joining}
          className="w-full h-14 text-base font-bold rounded-2xl gap-2"
        >
          {joining ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <UserPlus className="w-5 h-5" />
              Mettiti in Coda
            </>
          )}
        </Button>
      ) : (
        <Card className="bg-muted/50">
          <CardContent className="p-4 text-center">
            <AlertCircle className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Il salone è chiuso. Torna durante gli orari di apertura.</p>
          </CardContent>
        </Card>
      )}

      {/* Current Queue */}
      {status && status.queue.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-heading font-bold flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            Coda Attuale
          </h2>
          <Card>
            <CardContent className="p-0 divide-y divide-border/50">
              {status.queue.map(entry => (
                <div key={entry.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    #{entry.position}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{entry.customerName}</p>
                    {entry.service && (
                      <p className="text-[10px] text-muted-foreground">{entry.service}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span className="text-xs">~{entry.estimatedWait}m</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
