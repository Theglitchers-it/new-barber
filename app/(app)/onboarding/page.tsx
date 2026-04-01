"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Scissors, Clock, Users, Check, ArrowRight, ArrowLeft, Plus, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

const STEPS = [
  { title: "Il tuo salone", icon: Scissors },
  { title: "I tuoi servizi", icon: Clock },
  { title: "Il tuo team", icon: Users },
  { title: "Sei pronto!", icon: Check },
]

const SUGGESTED_SERVICES = [
  { name: "Taglio uomo", price: 20, duration: 30, category: "Taglio" },
  { name: "Barba", price: 15, duration: 20, category: "Barba" },
  { name: "Taglio + Barba", price: 30, duration: 45, category: "Taglio" },
  { name: "Colore", price: 45, duration: 60, category: "Colore" },
  { name: "Piega", price: 25, duration: 30, category: "Piega" },
]

type ServiceDraft = { name: string; price: number; duration: number; category: string }
type OperatorDraft = { name: string; role: string }

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)

  // Step 1: Salon info
  const [salonName, setSalonName] = useState("")
  const [address, setAddress] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [openTime, setOpenTime] = useState("09:00")
  const [closeTime, setCloseTime] = useState("19:00")

  // Step 2: Services
  const [services, setServices] = useState<ServiceDraft[]>([])

  // Step 3: Operators
  const [operators, setOperators] = useState<OperatorDraft[]>([{ name: "", role: "Stylist" }])

  function addSuggestedService(svc: ServiceDraft) {
    if (!services.find((s) => s.name === svc.name)) {
      setServices([...services, svc])
    }
  }

  function removeService(idx: number) {
    setServices(services.filter((_, i) => i !== idx))
  }

  function addOperator() {
    setOperators([...operators, { name: "", role: "Stylist" }])
  }

  function removeOperator(idx: number) {
    if (operators.length > 1) setOperators(operators.filter((_, i) => i !== idx))
  }

  async function handleComplete() {
    setSaving(true)
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salon: { salonName: salonName || "Il Mio Salone", address, phone, email, openTime, closeTime },
          services: services.length > 0 ? services : SUGGESTED_SERVICES.slice(0, 3),
          operators: operators.filter((o) => o.name.trim()),
        }),
      })
      if (res.ok) {
        toast.success("Salone configurato!")
        router.push("/dashboard")
      } else {
        const data = await res.json()
        toast.error(data.error || "Errore")
      }
    } catch {
      toast.error("Errore di connessione")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6 animate-fade-in">
        {/* Logo */}
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-3">
            <Scissors className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-heading font-extrabold">Configura SalonPro</h1>
          <p className="text-sm text-muted-foreground mt-1">4 passi per iniziare</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-2">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                i < step ? "gradient-primary text-white" : i === step ? "border-2 border-primary text-primary" : "border-2 border-muted text-muted-foreground"
              )}>
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && <div className={cn("w-8 h-0.5", i < step ? "bg-primary" : "bg-muted")} />}
            </div>
          ))}
        </div>

        <Card className="glass border-0 shadow-xl">
          <CardContent className="p-6">
            {/* Step 1: Salon Info */}
            {step === 0 && (
              <div className="space-y-4 animate-step-slide-left">
                <h2 className="text-lg font-heading font-bold">{STEPS[0].title}</h2>
                <div className="space-y-3">
                  <div><Label className="text-xs">Nome del salone *</Label><Input value={salonName} onChange={(e) => setSalonName(e.target.value)} placeholder="Es. Barbershop Milano" /></div>
                  <div><Label className="text-xs">Indirizzo</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Via Roma 42, Milano" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs">Telefono</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+39 02 1234567" /></div>
                    <div><Label className="text-xs">Email</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="info@salone.it" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs">Apertura</Label><Input type="time" value={openTime} onChange={(e) => setOpenTime(e.target.value)} /></div>
                    <div><Label className="text-xs">Chiusura</Label><Input type="time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} /></div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Services */}
            {step === 1 && (
              <div className="space-y-4 animate-step-slide-left">
                <h2 className="text-lg font-heading font-bold">{STEPS[1].title}</h2>
                <p className="text-sm text-muted-foreground">Seleziona i servizi suggeriti o aggiungine di nuovi</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_SERVICES.map((svc) => (
                    <button key={svc.name} onClick={() => addSuggestedService(svc)}
                      className={cn("px-3 py-1.5 rounded-full text-xs font-semibold border transition-all press-feedback",
                        services.find((s) => s.name === svc.name) ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/30"
                      )}>
                      {svc.name} · €{svc.price}
                    </button>
                  ))}
                </div>
                {services.length > 0 && (
                  <div className="space-y-2 pt-2">
                    {services.map((svc, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                        <span className="text-sm font-medium">{svc.name} — €{svc.price} · {svc.duration}min</span>
                        <button onClick={() => removeService(i)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Operators */}
            {step === 2 && (
              <div className="space-y-4 animate-step-slide-left">
                <h2 className="text-lg font-heading font-bold">{STEPS[2].title}</h2>
                <p className="text-sm text-muted-foreground">Chi lavora nel tuo salone?</p>
                <div className="space-y-3">
                  {operators.map((op, i) => (
                    <div key={i} className="flex gap-2">
                      <Input value={op.name} onChange={(e) => { const next = [...operators]; next[i].name = e.target.value; setOperators(next) }} placeholder="Nome operatore" className="flex-1" />
                      <Input value={op.role} onChange={(e) => { const next = [...operators]; next[i].role = e.target.value; setOperators(next) }} placeholder="Ruolo" className="w-32" />
                      {operators.length > 1 && (
                        <button onClick={() => removeOperator(i)} className="text-muted-foreground hover:text-destructive shrink-0"><Trash2 className="w-4 h-4" /></button>
                      )}
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={addOperator} className="gap-1"><Plus className="w-4 h-4" /> Aggiungi operatore</Button>
              </div>
            )}

            {/* Step 4: Complete */}
            {step === 3 && (
              <div className="space-y-4 animate-step-slide-left text-center">
                <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-lg font-heading font-bold">{STEPS[3].title}</h2>
                <p className="text-muted-foreground text-sm">
                  {salonName || "Il tuo salone"} è pronto con {services.length || 3} servizi e {operators.filter((o) => o.name.trim()).length || 1} operatore.
                </p>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-6">
              {step > 0 ? (
                <Button variant="ghost" onClick={() => setStep(step - 1)} className="gap-1"><ArrowLeft className="w-4 h-4" /> Indietro</Button>
              ) : <div />}
              {step < 3 ? (
                <Button onClick={() => setStep(step + 1)} className="btn-gradient rounded-xl gap-1">
                  Avanti <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button onClick={handleComplete} disabled={saving} className="btn-gradient rounded-xl gap-1">
                  {saving ? "Configurazione..." : "Vai alla Dashboard"} <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
