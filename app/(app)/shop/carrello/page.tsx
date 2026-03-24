"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Minus, Plus, Trash2, ArrowLeft, ShoppingBag } from "lucide-react"
import Link from "next/link"

type CartItemType = {
  id: string
  quantity: number
  product: {
    id: string
    name: string
    price: number
    image: string | null
    category: string
  }
}

export default function CarrelloPage() {
  const router = useRouter()
  const [items, setItems] = useState<CartItemType[]>([])
  const [loading, setLoading] = useState(true)
  const [ordering, setOrdering] = useState(false)

  const fetchCart = async (signal?: AbortSignal) => {
    try {
      const res = await fetch("/api/cart", { signal })
      const data = await res.json()
      setItems(Array.isArray(data) ? data : [])
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    fetchCart(controller.signal)
    return () => controller.abort()
  }, [])

  const updateQuantity = async (id: string, quantity: number) => {
    if (quantity < 1) {
      await removeItem(id)
      return
    }

    const res = await fetch(`/api/cart/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
    })

    if (res.ok) {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, quantity } : item))
      )
    }
  }

  const removeItem = async (id: string) => {
    const res = await fetch(`/api/cart/${id}`, { method: "DELETE" })
    if (res.ok) {
      setItems((prev) => prev.filter((item) => item.id !== id))
      toast.success("Prodotto rimosso")
    }
  }

  const placeOrder = async () => {
    setOrdering(true)
    const res = await fetch("/api/orders", { method: "POST" })

    if (res.ok) {
      const order = await res.json()
      toast.success("Ordine effettuato con successo!")
      router.push(`/ordini/${order.id}`)
    } else {
      const data = await res.json()
      toast.error(data.error || "Errore nell'ordine")
      setOrdering(false)
    }
  }

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const shipping = subtotal > 50 ? 0 : 4.90
  const total = subtotal + shipping

  if (loading) {
    return <div className="flex justify-center py-12">Caricamento...</div>
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/shop">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-semibold">Carrello</h1>
          <p className="text-muted-foreground mt-1">{items.length} prodotti</p>
        </div>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Il tuo carrello è vuoto</p>
            <Link href="/shop">
              <Button>Vai allo Shop</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {items.map((item) => (
              <Card key={item.id}>
                <CardContent className="flex items-center gap-3 p-3 sm:p-4">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-muted rounded-lg shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.product.name}</p>
                    <p className="text-sm text-muted-foreground">{item.product.category}</p>
                    <p className="font-bold mt-1">€{item.product.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-9 h-9 sm:w-8 sm:h-8"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-9 h-9 sm:w-8 sm:h-8"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 text-destructive"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="h-fit sticky top-6">
            <CardHeader>
              <CardTitle className="text-lg">Riepilogo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotale</span>
                <span>€{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Spedizione</span>
                <span>{shipping === 0 ? "Gratuita" : `€${shipping.toFixed(2)}`}</span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-muted-foreground">
                  Spedizione gratuita per ordini sopra €50
                </p>
              )}
              <div className="border-t pt-3 flex justify-between font-bold text-lg">
                <span>Totale</span>
                <span>€{total.toFixed(2)}</span>
              </div>
              <Button className="w-full mt-4" onClick={placeOrder} disabled={ordering}>
                {ordering ? "Ordine in corso..." : "Procedi all'ordine"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
