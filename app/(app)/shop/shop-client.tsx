"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Search, Star, ShoppingCart } from "lucide-react"
import Link from "next/link"
import { StaggerList, StaggerItem } from "@/components/ui/stagger-list"
import { proxyImageUrl } from "@/lib/image-url"

type Product = {
  id: string
  name: string
  description: string | null
  category: string
  price: number
  originalPrice: number | null
  stock: number
  image: string | null
  rating: number
  reviewCount: number
}

const categories = ["Tutti", "Shampoo", "Balsamo", "Trattamento", "Styling"]

export function ShopClient({ initialProducts, isLoggedIn = true }: { initialProducts: Product[]; isLoggedIn?: boolean }) {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("Tutti")
  const [cartCount, setCartCount] = useState(0)

  // Fetch cart count on mount with cleanup (only if logged in)
  useEffect(() => {
    if (!isLoggedIn) return
    const controller = new AbortController()
    fetch("/api/cart", { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCartCount(data.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0))
        }
      })
      .catch((e) => {
        if (e.name !== "AbortError") console.warn("Failed to fetch cart count", e)
      })
    return () => controller.abort()
  }, [isLoggedIn])

  const addToCart = async (productId: string) => {
    if (!isLoggedIn) {
      window.location.href = "/login"
      return
    }
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1 }),
      })

      if (res.ok) {
        toast.success("Aggiunto al carrello")
        setCartCount((c) => c + 1)
      } else {
        toast.error("Errore nell'aggiunta al carrello")
      }
    } catch {
      toast.error("Errore di connessione")
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return initialProducts.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(q)
      const matchesCategory = category === "Tutti" || p.category === category
      return matchesSearch && matchesCategory
    })
  }, [initialProducts, search, category])

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-extrabold">Shop</h1>
          <p className="text-muted-foreground mt-1">I migliori prodotti per i tuoi capelli</p>
        </div>
        {isLoggedIn ? (
          <Link href="/shop/carrello">
            <Button variant="outline" className="relative">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Carrello
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 p-0 flex items-center justify-center text-xs rounded-full gradient-primary text-white font-bold animate-bounce-in">
                  {cartCount}
                </span>
              )}
            </Button>
          </Link>
        ) : (
          <Link href="/login">
            <Button variant="outline">
              Accedi per acquistare
            </Button>
          </Link>
        )}
      </div>

      {/* Filtri */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cerca prodotti..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={category === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Prodotti */}
      <StaggerList className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4">
        {filtered.map((product, i) => (
          <StaggerItem key={product.id} index={i}>
          <Card className="overflow-hidden group glass border-0 shadow-md hover-lift rounded-2xl">
            <div className="aspect-square bg-muted relative overflow-hidden">
              {product.image && product.image !== "/placeholder.jpg" ? (
                <img
                  src={proxyImageUrl(product.image)!}
                  alt={product.name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              ) : (
                <div className="absolute inset-0 gradient-bg-subtle" />
              )}
              {product.originalPrice && (
                <span className="absolute top-2 left-2 gradient-primary text-white text-xs font-bold px-2 py-1 rounded-lg z-10">
                  -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                </span>
              )}
            </div>
            <CardContent className="p-2.5 sm:p-4 space-y-1 sm:space-y-2">
              <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider font-medium">
                {product.category}
              </p>
              <h3 className="font-bold text-sm sm:text-base line-clamp-1">{product.name}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1 sm:line-clamp-2">
                {product.description ?? ""}
              </p>
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-primary text-primary" />
                <span className="text-xs sm:text-sm font-medium">{product.rating}</span>
                <span className="text-[10px] sm:text-xs text-muted-foreground">({product.reviewCount})</span>
              </div>
              <div className="flex items-center justify-between pt-1.5 sm:pt-2 gap-1.5">
                <div className="min-w-0">
                  <span className="font-extrabold text-sm sm:text-lg gradient-text">€{product.price.toFixed(2)}</span>
                  {product.originalPrice && (
                    <span className="text-[10px] sm:text-sm text-muted-foreground line-through ml-1">
                      €{product.originalPrice.toFixed(2)}
                    </span>
                  )}
                </div>
                <Button
                  size="sm"
                  onClick={() => addToCart(product.id)}
                  disabled={product.stock === 0}
                  aria-label="Aggiungi al carrello"
                  className="h-8 w-8 sm:h-10 sm:w-auto sm:min-w-[44px] sm:px-3 p-0 sm:p-2 rounded-full sm:rounded-lg active:animate-pop shrink-0"
                >
                  <span className="sm:hidden text-lg leading-none">+</span>
                  <span className="hidden sm:inline">{product.stock === 0 ? "Esaurito" : "Aggiungi"}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
          </StaggerItem>
        ))}
      </StaggerList>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nessun prodotto trovato</p>
        </div>
      )}
    </div>
  )
}
