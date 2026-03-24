"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Search, Calendar, Clock, Check, Play, ArrowRight, Plus } from "lucide-react"
import Link from "next/link"
import {
  appointmentStatusLabels as statusLabels,
  appointmentStatusColors as statusColors,
  APPOINTMENT_STATUS,
} from "@/lib/constants"

type Appointment = {
  id: string
  date: string
  startTime: string
  endTime: string
  status: string
  totalPrice: number
  service: { name: string }
  operator: { name: string }
  user: { name: string | null }
}

const statusFilters = [
  { key: "ALL", label: "Tutti" },
  { key: APPOINTMENT_STATUS.PENDING, label: "In attesa" },
  { key: APPOINTMENT_STATUS.CONFIRMED, label: "Confermati" },
  { key: APPOINTMENT_STATUS.IN_PROGRESS, label: "In corso" },
  { key: APPOINTMENT_STATUS.COMPLETED, label: "Completati" },
  { key: APPOINTMENT_STATUS.CANCELLED, label: "Cancellati" },
]

const periodFilters = [
  { key: "ALL", label: "Tutti" },
  { key: "TODAY", label: "Oggi" },
  { key: "WEEK", label: "Settimana" },
  { key: "MONTH", label: "Mese" },
]

export function PrenotazioniClient({
  initialAppointments,
  isAdmin,
}: {
  initialAppointments: Appointment[]
  isAdmin: boolean
}) {
  const [appointments, setAppointments] = useState(initialAppointments)
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [periodFilter, setPeriodFilter] = useState("ALL")
  const [search, setSearch] = useState("")

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const a of appointments) counts[a.status] = (counts[a.status] || 0) + 1
    return counts
  }, [appointments])

  const filtered = useMemo(() => {
    const now = new Date()
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date(todayStart)
    todayEnd.setDate(todayEnd.getDate() + 1)

    const weekStart = new Date(todayStart)
    weekStart.setDate(weekStart.getDate() - 7)

    const monthStart = new Date(todayStart)
    monthStart.setMonth(monthStart.getMonth() - 1)

    return appointments.filter((apt) => {
      if (statusFilter !== "ALL" && apt.status !== statusFilter) return false

      if (periodFilter !== "ALL") {
        const aptDate = new Date(apt.date)
        if (periodFilter === "TODAY" && (aptDate < todayStart || aptDate >= todayEnd)) return false
        if (periodFilter === "WEEK" && aptDate < weekStart) return false
        if (periodFilter === "MONTH" && aptDate < monthStart) return false
      }

      if (search && isAdmin) {
        const q = search.toLowerCase()
        const matchesName = apt.user.name?.toLowerCase().includes(q)
        const matchesService = apt.service.name.toLowerCase().includes(q)
        if (!matchesName && !matchesService) return false
      }

      return true
    })
  }, [appointments, statusFilter, periodFilter, search, isAdmin])

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        setAppointments((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
        )
        const label = statusLabels[newStatus] || newStatus
        toast.success(`Appuntamento ${label.toLowerCase()}`)
      } else {
        toast.error("Errore nell'aggiornamento")
      }
    } catch {
      toast.error("Errore di connessione")
    }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-extrabold">
            {isAdmin ? "Prenotazioni" : "Le tue prenotazioni"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {isAdmin ? "Tutti gli appuntamenti del salone" : "Gestisci i tuoi appuntamenti"}
          </p>
        </div>
        <Link href="/prenotazioni/nuova" className="btn-gradient px-4 sm:px-5 py-2.5 rounded-xl font-bold inline-flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Nuova</span> Prenotazione
        </Link>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        {/* Status tabs */}
        <div className="flex gap-1.5 flex-wrap">
          {statusFilters.map((f) => (
            <Button
              key={f.key}
              variant={statusFilter === f.key ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(f.key)}
              className="text-xs"
            >
              {f.label}
              {f.key !== "ALL" && (
                <span className="ml-1 text-[10px] opacity-70">
                  {statusCounts[f.key] || 0}
                </span>
              )}
            </Button>
          ))}
        </div>

        {/* Period + Search row */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex gap-1.5">
            {periodFilters.map((f) => (
              <Button
                key={f.key}
                variant={periodFilter === f.key ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setPeriodFilter(f.key)}
                className="text-xs"
              >
                {f.label}
              </Button>
            ))}
          </div>
          {isAdmin && (
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cerca cliente o servizio..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
          )}
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground">
        {filtered.length} appuntament{filtered.length === 1 ? "o" : "i"}
      </p>

      {/* Appointments list */}
      {filtered.length === 0 ? (
        <Card className="glass">
          <CardContent className="py-12 text-center">
            <Calendar className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground mb-4">Nessun appuntamento trovato</p>
            <Button asChild>
              <Link href="/prenotazioni/nuova">Prenota ora</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((apt) => {
            const aptDate = new Date(apt.date)
            const isToday = aptDate.toDateString() === new Date().toDateString()

            return (
              <Card key={apt.id} className="glass hover-lift group">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-3">
                    {/* Date badge */}
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex flex-col items-center justify-center shrink-0 text-center ${isToday ? "gradient-primary text-white" : "bg-muted"}`}>
                      <span className="text-lg sm:text-xl font-extrabold leading-none">
                        {aptDate.getDate()}
                      </span>
                      <span className="text-[9px] sm:text-[10px] uppercase font-medium leading-none mt-0.5">
                        {aptDate.toLocaleDateString("it-IT", { month: "short" })}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-sm truncate">{apt.service.name}</p>
                        <Badge variant="secondary" className={`${statusColors[apt.status]} text-[10px] px-1.5 py-0`}>
                          {statusLabels[apt.status]}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {apt.startTime} — {apt.endTime} | {apt.operator.name}
                        {isAdmin && apt.user.name && ` | ${apt.user.name}`}
                      </p>
                      <p className="text-xs font-semibold gradient-text mt-0.5">€{apt.totalPrice.toFixed(2)}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isAdmin && apt.status === APPOINTMENT_STATUS.PENDING && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-8 px-2 gap-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                          onClick={() => updateStatus(apt.id, APPOINTMENT_STATUS.CONFIRMED)}
                        >
                          <Check className="w-3 h-3" />
                          <span className="hidden sm:inline">Conferma</span>
                        </Button>
                      )}
                      {isAdmin && apt.status === APPOINTMENT_STATUS.CONFIRMED && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-8 px-2 gap-1"
                          onClick={() => updateStatus(apt.id, APPOINTMENT_STATUS.IN_PROGRESS)}
                        >
                          <Play className="w-3 h-3" />
                          <span className="hidden sm:inline">Avvia</span>
                        </Button>
                      )}
                      {isAdmin && apt.status === APPOINTMENT_STATUS.IN_PROGRESS && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-8 px-2 gap-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                          onClick={() => updateStatus(apt.id, APPOINTMENT_STATUS.COMPLETED)}
                        >
                          <Check className="w-3 h-3" />
                          <span className="hidden sm:inline">Completa</span>
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="text-xs h-8 px-2 gap-1" asChild>
                        <Link href={`/prenotazioni/${apt.id}`}>
                          Dettagli <ArrowRight className="w-3 h-3" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
