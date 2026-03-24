"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { ArrowLeft, ShoppingCart } from "lucide-react"
import { StarRating } from "@/components/ui/star-rating"
import Link from "next/link"

type Product = {
  id: string
  name: string
  description: string
  category: string
  price: number
  originalPrice: number | null
  stock: number
  image: string | null
  rating: number
  reviewCount: number
}

export default function ProductDetailPage() {
  const params = useParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    fetch(`/api/products/${params.id}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        setProduct(data)
        setLoading(false)
      })
      .catch((e) => {
        if (e.name !== "AbortError") setLoading(false)
      })
    return () => controller.abort()
  }, [params.id])

  const addToCart = async () => {
    if (!product) return
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id, quantity: 1 }),
    })

    if (res.ok) {
      toast.success("Aggiunto al carrello")
    } else {
      toast.error("Errore")
    }
  }

  if (loading) return <div className="flex justify-center py-12">Caricamento...</div>
  if (!product) return <div className="text-center py-12">Prodotto non trovato</div>

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/shop">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" /> Torna allo Shop
        </Button>
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
        <div className="aspect-square bg-muted rounded-xl relative">
          {product.originalPrice && (
            <Badge className="absolute top-3 left-3 bg-destructive text-white">
              -{Math.round((1 - product.price / product.originalPrice) * 100)}%
            </Badge>
          )}
        </div>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground uppercase tracking-wider">{product.category}</p>
          <h1 className="text-3xl font-serif font-extrabold">{product.name}</h1>

          <div className="flex items-center gap-2">
            <StarRating rating={product.rating} size="sm" />
            <span className="text-sm text-muted-foreground">
              {product.rating} ({product.reviewCount} recensioni)
            </span>
          </div>

          <p className="text-muted-foreground">{product.description}</p>

          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold">€{product.price.toFixed(2)}</span>
            {product.originalPrice && (
              <span className="text-lg text-muted-foreground line-through">
                €{product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>

          <p className={`text-sm ${product.stock > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
            {product.stock > 0 ? `${product.stock} disponibili` : "Esaurito"}
          </p>

          <Button className="w-full" size="lg" onClick={addToCart} disabled={product.stock === 0}>
            <ShoppingCart className="w-4 h-4 mr-2" />
            {product.stock === 0 ? "Esaurito" : "Aggiungi al Carrello"}
          </Button>
        </div>
      </div>
    </div>
  )
}
