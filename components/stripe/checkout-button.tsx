"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CreditCard, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface CheckoutButtonProps {
  couponCode?: string
  disabled?: boolean
}

export function CheckoutButton({ couponCode, disabled }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)

  async function handleCheckout() {
    setLoading(true)
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ couponCode }),
      })

      const data = await res.json()
      if (res.ok && data.url) {
        window.location.href = data.url
      } else {
        toast.error(data.error || "Errore nel checkout")
        setLoading(false)
      }
    } catch {
      toast.error("Errore di connessione")
      setLoading(false)
    }
  }

  return (
    <Button
      className="w-full btn-gradient rounded-xl h-12 text-base font-bold"
      onClick={handleCheckout}
      disabled={disabled || loading}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
      ) : (
        <CreditCard className="w-5 h-5 mr-2" />
      )}
      {loading ? "Reindirizzamento..." : "Paga con Stripe"}
    </Button>
  )
}
