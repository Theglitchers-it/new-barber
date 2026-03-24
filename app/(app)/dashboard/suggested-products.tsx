"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShoppingBag, ArrowRight, Sparkles, Star, ShoppingCart, Heart } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { proxyImageUrl } from "@/lib/image-url"
import { cn } from "@/lib/utils"

interface SuggestedProduct {
  id: string
  name: string
  price: number
  originalPrice: number | null
  image: string | null
  rating: number
  reviewCount: number
  stock: number
}

export function SuggestedProducts({ products }: { products: SuggestedProduct[] }) {
  const [wishlist, setWishlist] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch("/api/wishlist")
      .then((r) => r.ok ? r.json() : [])
      .then((items: { product: { id: string } }[]) => {
        setWishlist(new Set(items.map((i) => i.product.id)))
      })
      .catch(() => {})
  }, [])

  if (products.length === 0) return null

  const addToCart = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1 }),
      })
      if (res.ok) {
        toast.success("Aggiunto al carrello", {
          action: {
            label: "Vai al carrello",
            onClick: () => { window.location.href = "/shop/carrello" },
          },
        })
      } else {
        toast.error("Errore nell'aggiunta al carrello")
      }
    } catch {
      toast.error("Errore di connessione")
    }
  }

  const toggleWishlist = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault()
    e.stopPropagation()
    const isInWishlist = wishlist.has(productId)
    try {
      const res = await fetch("/api/wishlist", {
        method: isInWishlist ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      })
      if (res.ok) {
        setWishlist((prev) => {
          const next = new Set(prev)
          if (isInWishlist) next.delete(productId)
          else next.add(productId)
          return next
        })
        toast.success(isInWishlist ? "Rimosso dai preferiti" : "Aggiunto ai preferiti")
      }
    } catch {
      toast.error("Errore di connessione")
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h2 className="text-base font-heading font-bold">Per te</h2>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/shop/carrello" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
            <ShoppingCart className="w-3 h-3" /> Carrello
          </Link>
          <Link href="/shop" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
            Vedi tutti <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
        {products.map((product) => {
          const isWished = wishlist.has(product.id)
          return (
            <Link key={product.id} href={`/shop/${product.id}`} className="block group">
              <Card className="glass hover-lift cursor-pointer h-full overflow-hidden border-0 shadow-sm transition-shadow duration-300 hover:shadow-md">
                <div className="w-full aspect-[4/3] bg-muted/30 overflow-hidden relative">
                  {product.image && product.image !== "/placeholder.jpg" ? (
                    <img
                      src={proxyImageUrl(product.image)!}
                      alt={product.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <ShoppingBag className="w-6 h-6 text-muted-foreground/30" />
                    </div>
                  )}
                  {product.originalPrice && (
                    <span className="absolute top-1 left-1 gradient-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md z-10">
                      -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                    </span>
                  )}
                  <button
                    onClick={(e) => toggleWishlist(e, product.id)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white/80 dark:bg-black/40 backdrop-blur-sm flex items-center justify-center z-10 transition-transform active:scale-90"
                  >
                    <Heart className={cn("w-3.5 h-3.5 transition-colors", isWished ? "fill-red-500 text-red-500" : "text-muted-foreground")} />
                  </button>
                </div>
                <CardContent className="p-2.5">
                  <p className="text-[11px] font-medium truncate">{product.name}</p>
                  <div className="flex items-center gap-0.5 mt-0.5">
                    <Star className="w-2.5 h-2.5 fill-primary text-primary" />
                    <span className="text-[10px] font-medium">{product.rating}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xs font-bold text-primary">&euro;{product.price.toFixed(2)}</span>
                      {product.originalPrice && (
                        <span className="text-[9px] text-muted-foreground line-through">&euro;{product.originalPrice.toFixed(2)}</span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={(e) => addToCart(e, product.id)}
                      disabled={product.stock === 0}
                      className="h-6 w-6 p-0 text-[10px] active:animate-pop rounded-full"
                    >
                      {product.stock === 0 ? "!" : "+"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
