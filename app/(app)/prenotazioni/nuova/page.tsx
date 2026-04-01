"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { StarRating } from "@/components/ui/star-rating"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
  Scissors,
  Clock,
  Euro,
  Check,
  ChevronLeft,
  Sparkles,
  Droplets,
  Crown,
  Calendar as CalendarIcon,
  User,
} from "lucide-react"
import { Celebration } from "@/components/ui/celebration"
import { it } from "date-fns/locale"

type Service = {
  id: string
  name: string
  description: string
  price: number
  duration: number
  category: string
  popular: boolean
}

type SlotData = {
  time: string
  operators: { operatorId: string; operatorName: string; rating?: number; role?: string; specializations?: string }[]
}

const steps = ["Servizio", "Data", "Operatore", "Conferma"]

const categoryIcons: Record<string, React.ElementType> = {
  Taglio: Scissors,
  Colore: Sparkles,
  Trattamento: Droplets,
  Piega: Sparkles,
}

export default function NuovaPrenotazionePage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState<"forward" | "backward">("forward")
  const [showCelebration, setShowCelebration] = useState(false)
  const [confirmedId, setConfirmedId] = useState<string | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [slots, setSlots] = useState<SlotData[]>([])
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [availableOperators, setAvailableOperators] = useState<SlotData["operators"]>([])
  const [selectedOperator, setSelectedOperator] = useState<SlotData["operators"][0] | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then(setServices)
      .catch(() => toast.error("Errore nel caricamento servizi"))
  }, [])

  const fetchSlots = useCallback(async (date: Date) => {
    if (!selectedService) return
    const dateStr = date.toISOString().split("T")[0]
    const res = await fetch(`/api/appointments/availability?date=${dateStr}&serviceId=${selectedService.id}`)
    const data = await res.json()

    const slotList: SlotData[] = Object.entries(data.slots || {}).map(
      ([time, operators]) => ({
        time,
        operators: operators as SlotData["operators"],
      })
    )
    slotList.sort((a, b) => a.time.localeCompare(b.time))
    setSlots(slotList)
  }, [selectedService])

  useEffect(() => {
    if (selectedDate && selectedService) {
      fetchSlots(selectedDate)
    }
  }, [selectedDate, selectedService, fetchSlots])

  useEffect(() => {
    if (selectedTime) {
      const slot = slots.find((s) => s.time === selectedTime)
      setAvailableOperators(slot?.operators || [])
      setSelectedOperator(null)
    }
  }, [selectedTime, slots])

  const goForward = (s: number) => { setDirection("forward"); setStep(s) }
  const goBack = (s: number) => { setDirection("backward"); setStep(s) }

  const stepAnimClass = direction === "forward" ? "animate-step-slide-left" : "animate-step-slide-right"

  const handleSubmit = async () => {
    if (!selectedService || !selectedDate || !selectedTime || !selectedOperator) return

    setLoading(true)
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: selectedService.id,
          operatorId: selectedOperator.operatorId,
          date: selectedDate.toISOString().split("T")[0],
          startTime: selectedTime,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || "Errore nella prenotazione")
        setLoading(false)
        return
      }

      const appointment = await res.json()
      toast.success("Prenotazione confermata!")
      setConfirmedId(appointment.id)
      setShowCelebration(true)
    } catch {
      toast.error("Errore nella prenotazione")
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-semibold">Nuova Prenotazione</h1>
        <p className="text-muted-foreground mt-1">Prenota il tuo appuntamento in pochi passi</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-center gap-2 md:gap-4">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2 md:gap-4">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300",
                  i < step && "bg-emerald-500 dark:bg-emerald-400 text-white shadow-md shadow-emerald-500/20",
                  i === step && "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md shadow-primary/20",
                  i > step && "bg-muted text-muted-foreground"
                )}
              >
                {i < step ? <Check className="w-5 h-5" /> : i + 1}
              </div>
              <span className={cn("text-xs mt-2 font-medium hidden md:block", i === step ? "text-foreground" : "text-muted-foreground")}>
                {s}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="w-8 md:w-12 h-0.5 mb-0 md:mb-6 bg-muted rounded-full overflow-hidden">
                <div className={cn("h-full bg-emerald-500 dark:bg-emerald-400 rounded-full transition-all duration-500", i < step ? "w-full" : "w-0")} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Servizio */}
      {step === 0 && (
        <Card key={`step-${step}`} className={cn("glass border-0 shadow-lg", stepAnimClass)}>
          <CardHeader>
            <CardTitle className="font-heading">Scegli il servizio</CardTitle>
            <CardDescription>Seleziona il servizio che desideri prenotare</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {services.map((service) => {
                const Icon = categoryIcons[service.category] || Scissors
                return (
                  <button
                    key={service.id}
                    onClick={() => {
                      setSelectedService(service)
                      goForward(1)
                    }}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-200 hover:shadow-md",
                      selectedService?.id === service.id
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{service.name}</p>
                        {service.popular && <Badge variant="secondary" className="text-[10px]">Popolare</Badge>}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {service.duration} min
                        </span>
                        <span className="flex items-center gap-1">
                          <Euro className="w-3 h-3" /> {service.price}€
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Data e Ora */}
      {step === 1 && (
        <Card className="glass border-0 shadow-lg animate-slide-up">
          <CardHeader>
            <CardTitle className="font-heading">Scegli data e orario</CardTitle>
            <CardDescription>
              {selectedService?.name} - {selectedService?.duration} min - €{selectedService?.price}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date)
                  setSelectedTime(null)
                }}
                disabled={(date) => date < new Date() || date.getDay() === 0}
                locale={it}
              />
            </div>

            {selectedDate && (
              <div className="animate-slide-up">
                <p className="text-sm font-medium mb-3">Orari disponibili</p>
                {slots.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Nessun orario disponibile per questa data
                  </p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {slots.map((slot) => (
                      <Button
                        key={slot.time}
                        variant={selectedTime === slot.time ? "default" : "outline"}
                        size="sm"
                        className="rounded-xl"
                        onClick={() => {
                          setSelectedTime(slot.time)
                          goForward(2)
                        }}
                      >
                        {slot.time}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => goBack(0)} className="rounded-xl">
                <ChevronLeft className="w-4 h-4 mr-2" /> Indietro
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Operatore */}
      {step === 2 && (
        <Card className="glass border-0 shadow-lg animate-slide-up">
          <CardHeader>
            <CardTitle className="font-heading">Scegli l&apos;operatore</CardTitle>
            <CardDescription>Operatori disponibili per {selectedTime}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {availableOperators.map((op) => (
              <button
                key={op.operatorId}
                onClick={() => {
                  setSelectedOperator(op)
                  goForward(3)
                }}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border w-full text-left transition-all duration-200 hover:shadow-md",
                  selectedOperator?.operatorId === op.operatorId
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-accent flex items-center justify-center text-lg font-semibold text-primary">
                  {op.operatorName[0]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{op.operatorName}</p>
                    {op.role && (
                      <Badge variant="outline" className="text-[10px]">
                        <Crown className="w-3 h-3 mr-1" />{op.role}
                      </Badge>
                    )}
                  </div>
                  {op.rating !== undefined && op.rating > 0 && (
                    <div className="flex items-center gap-2 mt-1">
                      <StarRating rating={op.rating} size="sm" />
                      <span className="text-xs text-muted-foreground">{op.rating.toFixed(1)}</span>
                    </div>
                  )}
                  {op.specializations && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {op.specializations.split(",").map((s) => (
                        <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{s.trim()}</span>
                      ))}
                    </div>
                  )}
                </div>
              </button>
            ))}

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => goBack(1)} className="rounded-xl">
                <ChevronLeft className="w-4 h-4 mr-2" /> Indietro
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Conferma */}
      {step === 3 && selectedService && selectedDate && selectedTime && selectedOperator && (
        <Card className="glass border-0 shadow-lg animate-slide-up">
          <CardHeader>
            <CardTitle className="font-heading">Conferma Prenotazione</CardTitle>
            <CardDescription>Verifica i dettagli prima di confermare</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl p-6 space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Servizio</span>
                <span className="font-medium">{selectedService.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Data</span>
                <span className="font-medium">
                  {selectedDate.toLocaleDateString("it-IT", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Orario</span>
                <span className="font-medium">{selectedTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Operatore</span>
                <span className="font-medium">{selectedOperator.operatorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Durata</span>
                <span className="font-medium">{selectedService.duration} min</span>
              </div>
              <div className="border-t border-border/50 pt-3 flex justify-between">
                <span className="font-semibold">Totale</span>
                <span className="font-bold text-xl gradient-text">€{selectedService.price}</span>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2 pt-4">
              <Button variant="outline" onClick={() => goBack(2)} className="rounded-xl">
                <ChevronLeft className="w-4 h-4 mr-2" /> Indietro
              </Button>
              <Button onClick={handleSubmit} disabled={loading} className="rounded-xl shadow-lg shadow-primary/20 active:animate-pop w-full sm:w-auto min-h-[44px] btn-gradient">
                {loading ? "Conferma in corso..." : "Conferma Prenotazione"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sticky Summary Bar */}
      {step > 0 && (
        <div className="sticky bottom-0 z-10 glass border-t border-border/40 p-3 rounded-t-xl animate-slide-up">
          <div className="flex items-center gap-2 flex-wrap">
            {selectedService && (
              <Badge variant="secondary" className="animate-bounce-in gap-1">
                <Scissors className="w-3 h-3" />
                {selectedService.name}
              </Badge>
            )}
            {selectedDate && selectedTime && (
              <Badge variant="secondary" className="animate-bounce-in gap-1">
                <CalendarIcon className="w-3 h-3" />
                {selectedDate.toLocaleDateString("it-IT", { day: "numeric", month: "short" })} · {selectedTime}
              </Badge>
            )}
            {selectedOperator && (
              <Badge variant="secondary" className="animate-bounce-in gap-1">
                <User className="w-3 h-3" />
                {selectedOperator.operatorName}
              </Badge>
            )}
            {selectedService && step === 3 && (
              <span className="ml-auto text-sm font-heading font-bold">
                €{selectedService.price.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Celebration Overlay */}
      {showCelebration && (
        <Celebration onComplete={() => confirmedId && router.push(`/prenotazioni/${confirmedId}`)} />
      )}
    </div>
  )
}
