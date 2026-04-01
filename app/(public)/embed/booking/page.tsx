"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar, Clock, User, Check, Scissors, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast, Toaster } from "sonner"

type Service = { id: string; name: string; price: number; duration: number; category: string }
type Operator = { id: string; name: string; role: string; rating: number }
type Slot = { time: string; available: boolean }

export default function EmbedBookingPage() {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const [services, setServices] = useState<Service[]>([])
  const [operators, setOperators] = useState<Operator[]>([])
  const [slots, setSlots] = useState<Slot[]>([])

  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedTime, setSelectedTime] = useState("")
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")

  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then((data) => setServices(data.filter((s: Service & { active: boolean }) => s.active)))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedService || !selectedDate) return
    fetch(`/api/appointments/availability?serviceId=${selectedService.id}&date=${selectedDate}`)
      .then((r) => r.ok ? r.json() : { slots: [], operators: [] })
      .then((data) => {
        setOperators(data.operators || [])
        setSlots(data.slots || [])
      })
  }, [selectedService, selectedDate])

  async function handleSubmit() {
    if (!selectedService || !selectedDate || !selectedTime || !name || !email) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/embed/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, email, phone,
          serviceId: selectedService.id,
          operatorId: selectedOperator?.id,
          date: selectedDate,
          startTime: selectedTime,
        }),
      })
      if (res.ok) {
        setSuccess(true)
      } else {
        const data = await res.json()
        toast.error(data.error || "Errore nella prenotazione")
      }
    } catch {
      toast.error("Errore di connessione")
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center p-8">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold mb-2">Prenotazione confermata!</h2>
          <p className="text-muted-foreground text-sm">Riceverai una conferma via email a {email}</p>
        </Card>
        <Toaster />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Skeleton className="w-full max-w-md h-96 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center">
          <Scissors className="w-8 h-8 mx-auto text-primary mb-2" />
          <h1 className="text-xl font-bold">Prenota un appuntamento</h1>
        </div>

        <Card>
          <CardContent className="p-5 space-y-4">
            {/* Step 0: Service */}
            {step === 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-sm flex items-center gap-2"><Scissors className="w-4 h-4" /> Scegli il servizio</h3>
                <div className="grid grid-cols-1 gap-2">
                  {services.map((svc) => (
                    <button key={svc.id} onClick={() => { setSelectedService(svc); setStep(1) }}
                      className="flex items-center justify-between p-3 rounded-xl border hover:border-primary/50 hover:bg-primary/5 transition-all text-left">
                      <div>
                        <p className="font-medium text-sm">{svc.name}</p>
                        <p className="text-xs text-muted-foreground">{svc.duration} min</p>
                      </div>
                      <span className="font-bold text-sm">€{svc.price}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 1: Date + Time */}
            {step === 1 && (
              <div className="space-y-3">
                <button onClick={() => setStep(0)} className="text-xs text-muted-foreground flex items-center gap-1"><ArrowLeft className="w-3 h-3" /> Cambia servizio</button>
                <h3 className="font-semibold text-sm flex items-center gap-2"><Calendar className="w-4 h-4" /> Data e orario</h3>
                <Input type="date" value={selectedDate} onChange={(e) => { setSelectedDate(e.target.value); setSelectedTime("") }}
                  min={new Date().toISOString().split("T")[0]} />
                {selectedDate && slots.length > 0 && (
                  <div className="grid grid-cols-4 gap-1.5">
                    {slots.filter((s) => s.available).map((slot) => (
                      <button key={slot.time} onClick={() => { setSelectedTime(slot.time); setStep(2) }}
                        className={cn("py-2 rounded-lg text-xs font-medium border transition-all",
                          selectedTime === slot.time ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/30"
                        )}>
                        {slot.time}
                      </button>
                    ))}
                  </div>
                )}
                {selectedDate && slots.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">Nessuno slot disponibile per questa data</p>
                )}
              </div>
            )}

            {/* Step 2: Contact info */}
            {step === 2 && (
              <div className="space-y-3">
                <button onClick={() => setStep(1)} className="text-xs text-muted-foreground flex items-center gap-1"><ArrowLeft className="w-3 h-3" /> Cambia orario</button>
                <h3 className="font-semibold text-sm flex items-center gap-2"><User className="w-4 h-4" /> I tuoi dati</h3>

                {operators.length > 0 && (
                  <div>
                    <Label className="text-xs mb-1 block">Operatore (opzionale)</Label>
                    <div className="flex gap-2 flex-wrap">
                      {operators.map((op) => (
                        <button key={op.id} onClick={() => setSelectedOperator(selectedOperator?.id === op.id ? null : op)}
                          className={cn("px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                            selectedOperator?.id === op.id ? "border-primary bg-primary/10 text-primary" : "border-border"
                          )}>
                          {op.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div><Label className="text-xs">Nome *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Il tuo nome" /></div>
                <div><Label className="text-xs">Email *</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="la-tua@email.it" /></div>
                <div><Label className="text-xs">Telefono</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+39 333 1234567" /></div>

                {/* Summary */}
                <div className="bg-muted/30 rounded-xl p-3 space-y-1">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Servizio</span><span className="font-medium">{selectedService?.name}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Data</span><span className="font-medium">{selectedDate}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Orario</span><span className="font-medium">{selectedTime}</span></div>
                  {selectedOperator && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Operatore</span><span className="font-medium">{selectedOperator.name}</span></div>}
                  <div className="flex justify-between text-sm font-bold pt-1 border-t"><span>Totale</span><span>€{selectedService?.price.toFixed(2)}</span></div>
                </div>

                <Button className="w-full" onClick={handleSubmit} disabled={submitting || !name || !email}>
                  {submitting ? "Prenotazione in corso..." : "Conferma prenotazione"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-[10px] text-muted-foreground">
          Powered by <span className="font-semibold">SalonPro</span>
        </p>
      </div>
      <Toaster />
    </div>
  )
}
