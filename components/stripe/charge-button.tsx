"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CreditCard, Loader2, Check } from "lucide-react"
import { toast } from "sonner"

interface ChargeButtonProps {
  appointmentId: string
  remaining: number
}

export function ChargeButton({ appointmentId, remaining }: ChargeButtonProps) {
  const [loading, setLoading] = useState(false)
  const [charged, setCharged] = useState(false)

  async function handleCharge() {
    setLoading(true)
    try {
      const res = await fetch(`/api/appointments/${appointmentId}/charge`, {
        method: "POST",
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Incasso di €${remaining.toFixed(2)} avviato`)
        setCharged(true)
      } else {
        toast.error(data.error || "Errore")
      }
    } catch {
      toast.error("Errore di connessione")
    } finally {
      setLoading(false)
    }
  }

  if (charged) {
    return (
      <Button variant="outline" size="sm" disabled className="gap-1.5">
        <Check className="w-4 h-4 text-green-500" /> Incasso avviato
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCharge}
      disabled={loading}
      className="gap-1.5"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
      Incassa €{remaining.toFixed(2)}
    </Button>
  )
}
