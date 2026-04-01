"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Package, Clock, Sparkles, Check } from "lucide-react"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import { packageStatusLabels, packageStatusColors } from "@/lib/constants"
import { cn } from "@/lib/utils"

interface ServiceItem {
  id: string
  serviceId: string
  quantity: number
  service: { id: string; name: string; price: number; duration: number }
}

interface PackageData {
  id: string
  name: string
  description: string | null
  price: number
  originalPrice: number
  totalSessions: number
  validityDays: number
  items: ServiceItem[]
}

interface UserPackageData {
  id: string
  sessionsUsed: number
  sessionsTotal: number
  purchasedAt: string
  expiresAt: string
  status: string
  package: PackageData
}

export default function PacchettiPage() {
  const { data: session, status } = useSession()
  const [packages, setPackages] = useState<PackageData[]>([])
  const [myPackages, setMyPackages] = useState<UserPackageData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") return

    Promise.all([
      fetch("/api/packages").then((r) => r.ok ? r.json() : []),
      session?.user ? fetch("/api/packages/my").then((r) => r.ok ? r.json() : []) : Promise.resolve([]),
    ]).then(([pkgs, mine]) => {
      setPackages(pkgs)
      setMyPackages(mine)
    }).finally(() => setLoading(false))
  }, [session, status])

  async function handlePurchase(packageId: string) {
    const res = await fetch("/api/packages/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packageId }),
    })
    if (res.ok) {
      toast.success("Pacchetto acquistato!")
      const mine = await fetch("/api/packages/my").then((r) => r.json())
      setMyPackages(mine)
    } else {
      const err = await res.json()
      toast.error(err.error || "Errore nell'acquisto")
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-8 w-48 rounded-xl bg-muted/40" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-64 rounded-xl bg-muted/40" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
          <Package className="w-6 h-6 text-primary" /> Pacchetti
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Risparmia con i nostri pacchetti servizi</p>
      </div>

      {/* Available packages */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {packages.map((pkg) => {
          const savings = Math.round(((pkg.originalPrice - pkg.price) / pkg.originalPrice) * 100)
          return (
            <Card key={pkg.id} className="overflow-hidden hover-lift transition-all duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg font-heading">{pkg.name}</CardTitle>
                  {savings > 0 && (
                    <Badge className="gradient-primary text-white text-xs">-{savings}%</Badge>
                  )}
                </div>
                {pkg.description && (
                  <p className="text-sm text-muted-foreground">{pkg.description}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">€{pkg.price.toFixed(2)}</span>
                  {pkg.originalPrice > pkg.price && (
                    <span className="text-sm text-muted-foreground line-through">€{pkg.originalPrice.toFixed(2)}</span>
                  )}
                </div>

                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" />{pkg.totalSessions} sessioni</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{pkg.validityDays} giorni</span>
                </div>

                <div className="space-y-1">
                  {pkg.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 text-sm">
                      <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
                      <span>{item.quantity}x {item.service.name}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{item.service.duration} min</span>
                    </div>
                  ))}
                </div>

                <Button
                  className="w-full btn-gradient rounded-xl"
                  onClick={() => handlePurchase(pkg.id)}
                >
                  Acquista
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {packages.length === 0 && (
        <Card className="p-8 text-center">
          <Package className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">Nessun pacchetto disponibile al momento</p>
        </Card>
      )}

      {/* My packages */}
      {myPackages.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-heading font-bold">I Miei Pacchetti</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myPackages.map((up) => {
              const progress = (up.sessionsUsed / up.sessionsTotal) * 100
              const isActive = up.status === "ACTIVE"
              const expiresAt = new Date(up.expiresAt)

              return (
                <Card key={up.id} className={cn("transition-all", !isActive && "opacity-60")}>
                  <CardContent className="pt-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{up.package.name}</h3>
                      <Badge className={packageStatusColors[up.status]}>
                        {packageStatusLabels[up.status] || up.status}
                      </Badge>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Sessioni</span>
                        <span className="font-medium">{up.sessionsUsed}/{up.sessionsTotal}</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Scade il {expiresAt.toLocaleDateString("it-IT")}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
