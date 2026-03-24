"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StarRating } from "@/components/ui/star-rating"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Plus,
  Users,
  Calendar,
  Euro,
  Search,
  Loader2,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import Link from "next/link"

interface OperatorStats {
  totalAppointments: number
  completedAppointments: number
  revenue: number
  noShowCount: number
}

interface Operator {
  id: string
  name: string
  role: string
  specializations: string | null
  image: string | null
  email: string | null
  phone: string | null
  rating: number
  reviewCount: number
  active: boolean
  stats: OperatorStats
  _count: {
    appointments: number
    reviews: number
  }
}

export default function OperatoriPage() {
  const [operators, setOperators] = useState<Operator[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetch("/api/operators")
      .then((res) => res.json())
      .then((data) => {
        setOperators(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = operators.filter(
    (op) =>
      op.name.toLowerCase().includes(search.toLowerCase()) ||
      op.role.toLowerCase().includes(search.toLowerCase()) ||
      (op.specializations?.toLowerCase().includes(search.toLowerCase()) ?? false)
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-slide-up">
        <div>
          <h1 className="text-3xl font-heading font-extrabold">Operatori</h1>
          <p className="text-muted-foreground mt-1">
            {operators.length} operatori attivi
          </p>
        </div>
        <Link href="/operatori/nuovo">
          <Button className="bg-gradient-to-r from-primary to-primary/80">
            <Plus className="w-4 h-4 mr-2" /> Aggiungi operatore
          </Button>
        </Link>
      </div>

      {/* Ricerca */}
      <div className="relative max-w-md animate-slide-up" style={{ animationDelay: "50ms" }}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Cerca operatore..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Statistiche generali */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-slide-up" style={{ animationDelay: "100ms" }}>
        <Card className="glass">
          <CardContent className="flex items-center gap-4 p-4 sm:p-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{operators.length}</p>
              <p className="text-sm text-muted-foreground">Operatori attivi</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="flex items-center gap-4 p-4 sm:p-6">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {operators.reduce((sum, op) => sum + op.stats.completedAppointments, 0)}
              </p>
              <p className="text-sm text-muted-foreground">Appuntamenti completati</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="flex items-center gap-4 p-4 sm:p-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Euro className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                &euro;{Math.round(operators.reduce((sum, op) => sum + op.stats.revenue, 0))}
              </p>
              <p className="text-sm text-muted-foreground">Revenue totale</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Griglia operatori */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>Nessun operatore trovato</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((operator, index) => (
            <Link key={operator.id} href={`/operatori/${operator.id}`}>
              <Card
                className="glass hover:shadow-lg transition-all duration-300 cursor-pointer group animate-slide-up overflow-hidden"
                style={{ animationDelay: `${150 + index * 50}ms` }}
              >
                {/* Header con gradiente */}
                <div className="h-20 bg-gradient-to-r from-primary/20 to-primary/5 relative">
                  <Avatar className="w-16 h-16 absolute -bottom-8 left-6 border-4 border-background shadow-md group-hover:scale-105 transition-transform">
                    {operator.image && <AvatarImage src={operator.image} alt={operator.name} />}
                    <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">
                      {operator.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <CardContent className="pt-12 pb-6 px-6 space-y-4">
                  {/* Info */}
                  <div>
                    <h3 className="text-lg font-heading font-semibold group-hover:text-primary transition-colors">
                      {operator.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{operator.role}</p>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-2">
                    <StarRating rating={operator.rating} size="sm" />
                    <span className="text-sm text-muted-foreground">
                      ({operator.reviewCount})
                    </span>
                  </div>

                  {/* Specializzazioni */}
                  {operator.specializations && (
                    <div className="flex flex-wrap gap-1.5">
                      {operator.specializations.split(",").map((spec) => (
                        <Badge
                          key={spec.trim()}
                          variant="secondary"
                          className="text-xs font-normal"
                        >
                          {spec.trim()}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                    <div className="text-center">
                      <p className="text-lg font-bold">{operator.stats.completedAppointments}</p>
                      <p className="text-xs text-muted-foreground">Completati</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold">
                        &euro;{Math.round(operator.stats.revenue)}
                      </p>
                      <p className="text-xs text-muted-foreground">Revenue</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold">{operator.reviewCount}</p>
                      <p className="text-xs text-muted-foreground">Recensioni</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
