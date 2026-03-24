"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { StarRating } from "@/components/ui/star-rating"
import { toast } from "sonner"
import {
  ArrowLeft, AlertTriangle, StickyNote, Star, CalendarClock, Bell, Check,
  Scissors, Clock, Euro, User, MapPin, Calendar, Play, Phone, Mail,
} from "lucide-react"
import Link from "next/link"
import { appointmentStatusLabels as statusLabels, appointmentStatusColors as statusColors, APPOINTMENT_STATUS } from "@/lib/constants"

const cancellationReasons = [
  "Impegno personale",
  "Malattia",
  "Cambio programma",
  "Problemi di trasporto",
  "Altro",
]

type Appointment = {
  id: string
  date: string
  startTime: string
  endTime: string
  status: string
  totalPrice: number
  notes: string | null
  cancellationReason: string | null
  cancelledAt: string | null
  noShow: boolean
  staffNotes: string | null
  deposit: number | null
  reminderSent: boolean
  service: { id: string; name: string; duration: number }
  operator: { id: string; name: string; role: string }
  user: { name: string; email: string; phone: string | null }
  review?: { id: string; rating: number; comment: string | null } | null
}

type SlotOperator = {
  operatorId: string
  operatorName: string
  rating: number
  role: string
}

export default function AppointmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [cancelNote, setCancelNote] = useState("")
  const [staffNotes, setStaffNotes] = useState("")
  const [savingNotes, setSavingNotes] = useState(false)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState("")
  const [submittingReview, setSubmittingReview] = useState(false)
  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const [rescheduleDate, setRescheduleDate] = useState("")
  const [rescheduleTime, setRescheduleTime] = useState("")
  const [rescheduleOperator, setRescheduleOperator] = useState("")
  const [availableSlots, setAvailableSlots] = useState<Record<string, SlotOperator[]>>({})
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [rescheduling, setRescheduling] = useState(false)
  const [sendingReminder, setSendingReminder] = useState(false)

  const isAdmin = session?.user?.role === "ADMIN"

  useEffect(() => {
    const controller = new AbortController()
    fetch(`/api/appointments/${params.id}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => { setAppointment(data); setStaffNotes(data.staffNotes || ""); setLoading(false) })
      .catch((e) => { if (e.name !== "AbortError") setLoading(false) })
    return () => controller.abort()
  }, [params.id])

  useEffect(() => {
    if (!rescheduleDate || !appointment) return
    setLoadingSlots(true); setRescheduleTime(""); setRescheduleOperator("")
    fetch(`/api/appointments/availability?date=${rescheduleDate}&serviceId=${appointment.service.id}`)
      .then((r) => r.json())
      .then((data) => { setAvailableSlots(data.slots || {}); setLoadingSlots(false) })
      .catch(() => setLoadingSlots(false))
  }, [rescheduleDate, appointment])

  const updateStatus = async (status: string) => {
    try {
      const res = await fetch(`/api/appointments/${params.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        const updated = await res.json()
        setAppointment((prev) => prev ? { ...prev, status: updated.status } : null)
        toast.success(`Stato aggiornato: ${statusLabels[status]}`)
      } else toast.error("Errore nell'aggiornamento")
    } catch { toast.error("Errore di connessione") }
  }

  const handleCancel = async () => {
    const reason = cancelReason === "Altro" ? cancelNote : cancelReason
    if (!reason) { toast.error("Seleziona un motivo"); return }
    try {
      const res = await fetch(`/api/appointments/${params.id}/cancel`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      })
      if (res.ok) {
        setAppointment((prev) => prev ? { ...prev, status: APPOINTMENT_STATUS.CANCELLED, cancellationReason: reason, cancelledAt: new Date().toISOString() } : null)
        setCancelDialogOpen(false)
        toast.success("Prenotazione cancellata")
      } else toast.error("Errore nella cancellazione")
    } catch { toast.error("Errore di connessione") }
  }

  const handleNoShow = async () => {
    const res = await fetch(`/api/appointments/${params.id}/no-show`, { method: "POST" })
    if (res.ok) { setAppointment((prev) => prev ? { ...prev, noShow: true } : null); toast.success("Segnato come no-show") }
  }

  const handleSaveNotes = async () => {
    setSavingNotes(true)
    const res = await fetch(`/api/appointments/${params.id}/notes`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staffNotes }),
    })
    setSavingNotes(false)
    if (res.ok) toast.success("Note salvate")
  }

  const handleSubmitReview = async () => {
    if (reviewRating === 0) { toast.error("Seleziona una valutazione"); return }
    setSubmittingReview(true)
    try {
      const res = await fetch(`/api/appointments/${params.id}/review`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: reviewRating, comment: reviewComment || undefined }),
      })
      if (res.ok) {
        const review = await res.json()
        setAppointment((prev) => prev ? { ...prev, review } : null)
        toast.success("Recensione inviata! Punti fedeltà accreditati.")
      } else {
        const err = await res.json()
        toast.error(err.error || "Errore nell'invio")
      }
    } catch { toast.error("Errore di connessione") }
    setSubmittingReview(false)
  }

  const handleReschedule = async () => {
    if (!rescheduleDate || !rescheduleTime) { toast.error("Seleziona data e orario"); return }
    setRescheduling(true)
    try {
      const res = await fetch(`/api/appointments/${params.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: rescheduleDate, startTime: rescheduleTime, ...(rescheduleOperator ? { operatorId: rescheduleOperator } : {}) }),
      })
      if (res.ok) {
        const updated = await res.json()
        setAppointment((prev) => prev ? { ...prev, date: updated.date, startTime: updated.startTime, endTime: updated.endTime, operator: updated.operator } : null)
        setRescheduleOpen(false)
        toast.success("Appuntamento riprogrammato")
      } else {
        const err = await res.json()
        toast.error(err.error || "Errore nella riprogrammazione")
      }
    } catch { toast.error("Errore di connessione") }
    setRescheduling(false)
  }

  const handleSendReminder = async () => {
    setSendingReminder(true)
    try {
      const res = await fetch(`/api/appointments/${params.id}/reminder`, { method: "POST" })
      if (res.ok) {
        setAppointment((prev) => prev ? { ...prev, reminderSent: true } : null)
        toast.success("Promemoria inviato al cliente")
      } else toast.error("Errore nell'invio")
    } catch { toast.error("Errore di connessione") }
    setSendingReminder(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!appointment) {
    return <div className="text-center py-12 text-muted-foreground">Appuntamento non trovato</div>
  }

  const canReschedule = isAdmin && appointment.status !== APPOINTMENT_STATUS.COMPLETED && appointment.status !== APPOINTMENT_STATUS.CANCELLED
  const canCancel = appointment.status === APPOINTMENT_STATUS.PENDING || appointment.status === APPOINTMENT_STATUS.CONFIRMED
  const canRemind = isAdmin && !appointment.reminderSent && appointment.status !== APPOINTMENT_STATUS.COMPLETED && appointment.status !== APPOINTMENT_STATUS.CANCELLED
  const sortedSlotTimes = Object.keys(availableSlots).sort()
  const aptDate = new Date(appointment.date)
  const isToday = aptDate.toDateString() === new Date().toDateString()

  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-slide-up">
      {/* Back */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="rounded-xl shrink-0" asChild>
          <Link href="/prenotazioni"><ArrowLeft className="w-4 h-4" /></Link>
        </Button>
        <h1 className="text-xl md:text-2xl font-heading font-extrabold">Dettaglio Prenotazione</h1>
      </div>

      {/* ═══════ HERO CARD ═══════ */}
      <Card className="glass border-0 shadow-lg">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start gap-3">
            {/* Date badge */}
            <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0 ${isToday ? "gradient-primary text-white" : "bg-muted"}`}>
              <span className="text-xl font-extrabold leading-none">{aptDate.getDate()}</span>
              <span className="text-[9px] uppercase font-medium opacity-70 leading-none mt-0.5">
                {aptDate.toLocaleDateString("it-IT", { month: "short" })}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-heading font-extrabold">{appointment.service.name}</h2>
              <p className="text-muted-foreground text-sm mt-0.5">con <span className="font-medium text-foreground">{appointment.operator.name}</span></p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant="secondary" className={`${statusColors[appointment.status]} border-0 font-semibold text-xs`}>
                  {statusLabels[appointment.status]}
                </Badge>
                {appointment.noShow && <Badge variant="destructive" className="text-xs">No-Show</Badge>}
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mt-4 pt-3 border-t border-border/30">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <div>
                <p className="font-bold text-sm">{appointment.startTime} — {appointment.endTime}</p>
                <p className="text-[10px] text-muted-foreground">{appointment.service.duration} min</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Euro className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <div>
                <p className="font-bold text-sm gradient-text">€{appointment.totalPrice.toFixed(2)}</p>
                <p className="text-[10px] text-muted-foreground">Totale</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <div>
                <p className="font-bold text-sm">
                  {aptDate.toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" })}
                </p>
                <p className="text-[10px] text-muted-foreground">{aptDate.getFullYear()}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══════ INFO GRID ═══════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Operator card */}
        <Card className="glass glow-card hover-lift">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[oklch(0.42_0.18_260)] to-[oklch(0.55_0.24_25)] flex items-center justify-center shrink-0 shadow-md">
              <Scissors className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Operatore</p>
              <p className="font-bold text-sm truncate">{appointment.operator.name}</p>
              <p className="text-[10px] text-muted-foreground">{appointment.operator.role}</p>
            </div>
          </CardContent>
        </Card>

        {/* Client card (admin) */}
        {isAdmin && (
          <Card className="glass glow-card hover-lift">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl gradient-primary flex items-center justify-center shrink-0 shadow-md">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Cliente</p>
                <p className="font-bold text-sm truncate">{appointment.user.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                    <Mail className="w-2.5 h-2.5" /> {appointment.user.email}
                  </span>
                  {appointment.user.phone && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <Phone className="w-2.5 h-2.5" /> {appointment.user.phone}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ═══════ ALERTS ═══════ */}
      {appointment.cancellationReason && (
        <div className="bg-destructive/10 rounded-xl p-4 flex items-start gap-3 animate-fade-in">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-destructive">Appuntamento Cancellato</p>
            <p className="text-sm mt-0.5">{appointment.cancellationReason}</p>
            {appointment.cancelledAt && (
              <p className="text-xs text-muted-foreground mt-1">
                il {new Date(appointment.cancelledAt).toLocaleDateString("it-IT")}
              </p>
            )}
          </div>
        </div>
      )}

      {appointment.notes && (
        <div className="bg-muted/50 rounded-xl p-4 flex items-start gap-3">
          <StickyNote className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium">Note del cliente</p>
            <p className="text-sm text-muted-foreground mt-0.5">{appointment.notes}</p>
          </div>
        </div>
      )}

      {/* ═══════ STATUS ACTIONS ═══════ */}
      {(isAdmin || canCancel) && (
        <Card className="glass border-0">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Azioni</p>
            <div className="flex flex-wrap gap-2">
              {isAdmin && appointment.status !== APPOINTMENT_STATUS.COMPLETED && appointment.status !== APPOINTMENT_STATUS.CANCELLED && (
                <>
                  {appointment.status === APPOINTMENT_STATUS.PENDING && (
                    <Button size="sm" onClick={() => updateStatus(APPOINTMENT_STATUS.CONFIRMED)} className="rounded-xl gap-1.5 bg-emerald-600 hover:bg-emerald-700">
                      <Check className="w-3.5 h-3.5" /> Conferma
                    </Button>
                  )}
                  {appointment.status === APPOINTMENT_STATUS.CONFIRMED && (
                    <Button size="sm" onClick={() => updateStatus(APPOINTMENT_STATUS.IN_PROGRESS)} className="rounded-xl gap-1.5">
                      <Play className="w-3.5 h-3.5" /> Avvia
                    </Button>
                  )}
                  {appointment.status === APPOINTMENT_STATUS.IN_PROGRESS && (
                    <Button size="sm" onClick={() => updateStatus(APPOINTMENT_STATUS.COMPLETED)} className="rounded-xl gap-1.5 bg-emerald-600 hover:bg-emerald-700">
                      <Check className="w-3.5 h-3.5" /> Completa
                    </Button>
                  )}
                  {!appointment.noShow && (
                    <Button size="sm" variant="outline" onClick={handleNoShow} className="rounded-xl text-xs">
                      Segna No-Show
                    </Button>
                  )}
                </>
              )}

              {canCancel && (
                <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="destructive" className="rounded-xl">Cancella</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Cancella Prenotazione</DialogTitle>
                      <DialogDescription>Seleziona il motivo della cancellazione</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Select value={cancelReason} onValueChange={setCancelReason}>
                        <SelectTrigger><SelectValue placeholder="Seleziona motivo" /></SelectTrigger>
                        <SelectContent>
                          {cancellationReasons.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {cancelReason === "Altro" && (
                        <Textarea placeholder="Specifica il motivo..." value={cancelNote} onChange={(e) => setCancelNote(e.target.value)} />
                      )}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>Annulla</Button>
                      <Button variant="destructive" onClick={handleCancel}>Conferma Cancellazione</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══════ ADMIN TOOLS ═══════ */}
      {isAdmin && (
        <Card className="glass glow-card border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Strumenti Admin</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {canReschedule && (
                <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="rounded-xl gap-1.5">
                      <CalendarClock className="w-3.5 h-3.5" /> Riprogramma
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Riprogramma Appuntamento</DialogTitle>
                      <DialogDescription>Seleziona nuova data, orario e operatore</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Nuova data</label>
                        <input
                          type="date"
                          value={rescheduleDate}
                          onChange={(e) => setRescheduleDate(e.target.value)}
                          min={new Date().toISOString().split("T")[0]}
                          className="w-full mt-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
                        />
                      </div>
                      {loadingSlots && <p className="text-sm text-muted-foreground">Caricamento slot...</p>}
                      {rescheduleDate && !loadingSlots && sortedSlotTimes.length > 0 && (
                        <div>
                          <label className="text-sm font-medium">Orario</label>
                          <div className="grid grid-cols-4 gap-1.5 mt-1">
                            {sortedSlotTimes.map((time) => (
                              <Button key={time} size="sm" variant={rescheduleTime === time ? "default" : "outline"}
                                onClick={() => { setRescheduleTime(time); setRescheduleOperator("") }} className="text-xs">
                                {time}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                      {rescheduleDate && !loadingSlots && sortedSlotTimes.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">Nessuno slot disponibile</p>
                      )}
                      {rescheduleTime && availableSlots[rescheduleTime] && (
                        <div>
                          <label className="text-sm font-medium">Operatore</label>
                          <div className="space-y-1.5 mt-1">
                            {availableSlots[rescheduleTime].map((op) => (
                              <button key={op.operatorId} onClick={() => setRescheduleOperator(op.operatorId)}
                                className={`w-full text-left p-2.5 rounded-lg border text-sm transition-colors ${
                                  rescheduleOperator === op.operatorId ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                                }`}>
                                <p className="font-medium">{op.operatorName}</p>
                                <p className="text-xs text-muted-foreground">{op.role} — {op.rating.toFixed(1)} ★</p>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setRescheduleOpen(false)}>Annulla</Button>
                      <Button onClick={handleReschedule} disabled={rescheduling || !rescheduleDate || !rescheduleTime}>
                        {rescheduling ? "Riprogrammando..." : "Conferma"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}

              {canRemind && (
                <Button size="sm" variant="outline" className="rounded-xl gap-1.5"
                  onClick={handleSendReminder} disabled={sendingReminder}>
                  <Bell className="w-3.5 h-3.5" />
                  {sendingReminder ? "Invio..." : "Invia Promemoria"}
                </Button>
              )}
              {appointment.reminderSent && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <Check className="w-3 h-3" /> Promemoria inviato
                </Badge>
              )}
            </div>

            {/* Staff Notes */}
            <div className="border-t pt-3">
              <p className="text-sm font-medium flex items-center gap-1.5 mb-2">
                <StickyNote className="w-3.5 h-3.5" /> Note Staff
              </p>
              <Textarea placeholder="Note interne..." value={staffNotes}
                onChange={(e) => setStaffNotes(e.target.value)} rows={3} className="text-sm" />
              <Button size="sm" onClick={handleSaveNotes} disabled={savingNotes} className="rounded-xl mt-2">
                {savingNotes ? "Salvando..." : "Salva Note"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══════ REVIEW ═══════ */}
      {appointment.status === APPOINTMENT_STATUS.COMPLETED && !isAdmin && (
        <Card className="glass glow-card border-0">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Star className="w-4 h-4 text-primary" /> Recensione
            </CardTitle>
          </CardHeader>
          <CardContent>
            {appointment.review ? (
              <div className="space-y-2">
                <StarRating rating={appointment.review.rating} />
                {appointment.review.comment && <p className="text-sm text-muted-foreground">{appointment.review.comment}</p>}
                <Badge variant="secondary" className="text-xs gap-1 status-completed">
                  <Check className="w-3 h-3" /> Recensione inviata
                </Badge>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Come è stata la tua esperienza con {appointment.operator.name}?</p>
                  <StarRating rating={reviewRating} interactive onChange={setReviewRating} size="lg" />
                </div>
                <Textarea placeholder="Lascia un commento (opzionale)..." value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)} rows={3} />
                <Button onClick={handleSubmitReview} disabled={submittingReview || reviewRating === 0} className="rounded-xl btn-gradient">
                  {submittingReview ? "Invio in corso..." : "Invia Recensione"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
