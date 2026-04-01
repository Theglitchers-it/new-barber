"use client"

import { useState } from "react"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { stripePromise } from "@/lib/stripe-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Shield } from "lucide-react"
import { toast } from "sonner"

function DepositPaymentForm({ amount, onSuccess }: { amount: number; onSuccess: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return

    setLoading(true)
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/prenotazioni?deposit=success`,
      },
      redirect: "if_required",
    })

    if (error) {
      toast.error(error.message || "Errore nel pagamento")
      setLoading(false)
    } else {
      toast.success("Deposito versato!")
      onSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <Shield className="w-4 h-4" />
        Pagamento sicuro con Stripe
      </div>
      <PaymentElement />
      <Button
        type="submit"
        className="w-full btn-gradient rounded-xl"
        disabled={!stripe || loading}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
        ) : null}
        Paga deposito €{amount.toFixed(2)}
      </Button>
    </form>
  )
}

interface DepositFormProps {
  clientSecret: string
  amount: number
  onSuccess: () => void
}

export function DepositForm({ clientSecret, amount, onSuccess }: DepositFormProps) {
  if (!stripePromise) return null

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          Deposito richiesto
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "stripe" } }}>
          <DepositPaymentForm amount={amount} onSuccess={onSuccess} />
        </Elements>
      </CardContent>
    </Card>
  )
}
