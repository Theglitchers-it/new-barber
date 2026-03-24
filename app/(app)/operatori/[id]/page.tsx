"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StarRating } from "@/components/ui/star-rating"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  ArrowLeft,
  Calendar,
  Euro,
  AlertTriangle,
  Clock,
  Mail,
  Phone,
  Loader2,
  Star,
  User,
  Camera,
} from "lucide-react"
import Link from "next/link"
import { PortfolioGallery } from "@/components/operator/portfolio-gallery"
import { appointmentStatusLabels as statusLabels, appointmentStatusColors as statusColors, APPOINTMENT_STATUS } from "@/lib/constants"

const dayNames = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"]

interface OperatorDetail {
  id: string
  name: string
  role: string
  specializations: string | null
  image: string | null
  email: string | null
  phone: string | null
  bio: string | null
  rating: number
  reviewCount: number
  commission: number | null
  hireDate: string | null
  active: boolean
  availabilities: Array<{
    id: string
    dayOfWeek: number
    startTime: string
    endTime: string
  }>
  reviews: Array<{
    id: string
    rating: number
    comment: string | null
    reply: string | null
    replyDate: string | null
    createdAt: string
    user: { name: string | null; image: string | null }
    appointment: { service: { name: string } }
  }>
  appointments: Array<{
    id: string
    date: string
    startTime: string
    endTime: string
    status: string
    totalPrice: number
    service: { name: string }
    user: { id: string; name: string | null }
  }>
  stats: {
    totalAppointments: number
    completedAppointments: number
    revenue: number
    noShowCount: number
    noShowRate: string
  }
}

export default function OperatoreDetailPage() {
  const params = useParams()
  const [operator, setOperator] = useState<OperatorDetail | null>(null)
  const [portfolio, setPortfolio] = useState<Array<{ id: string; beforeImage: string | null; afterImage: string; caption: string | null; service: { name: string } | null; createdAt: string }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!params.id) return
    Promise.all([
      fetch(`/api/operators/${params.id}`).then((res) => res.ok ? res.json() : null),
      fetch(`/api/operator-portfolio?operatorId=${params.id}`).then((res) => res.ok ? res.json() : []),
    ]).then(([opData, portfolioData]) => {
      setOperator(opData)
      setPortfolio(portfolioData || [])
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })
  }, [params.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!operator) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Operatore non trovato</p>
        <Link href="/operatori">
          <Button variant="ghost" className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Torna alla lista
          </Button>
        </Link>
      </div>
    )
  }

  // Filtra appuntamenti futuri
  const now = new Date()
  const upcomingAppointments = operator.appointments
    .filter((apt) => new Date(apt.date) >= now && apt.status !== APPOINTMENT_STATUS.CANCELLED)
    .slice(0, 10)

  // Crea la griglia orari (Lun-Sab = dayOfWeek 1-6)
  const scheduleByDay = new Map<number, { startTime: string; endTime: string }>()
  operator.availabilities.forEach((avail) => {
    scheduleByDay.set(avail.dayOfWeek, {
      startTime: avail.startTime,
      endTime: avail.endTime,
    })
  })

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 animate-slide-up">
        <Link href="/operatori">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-heading font-extrabold">Dettaglio Operatore</h1>
        </div>
      </div>

      {/* Profilo */}
      <Card className="glass overflow-hidden animate-slide-up" style={{ animationDelay: "50ms" }}>
        <div className="h-28 bg-gradient-to-r from-primary/30 to-primary/5" />
        <CardContent className="relative pt-0 pb-6 px-6">
          {/* Avatar + Nome */}
          <div className="flex flex-col items-center text-center -mt-12 mb-5">
            <Avatar className="w-24 h-24 border-4 border-background shadow-lg mb-3">
              {operator.image && (
                <AvatarImage src={operator.image} alt={operator.name} />
              )}
              <AvatarFallback className="text-2xl font-semibold bg-primary/10 text-primary">
                {operator.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-2xl font-heading font-bold">{operator.name}</h2>
            <p className="text-sm text-muted-foreground">{operator.role}</p>
            <div className="flex items-center gap-2 mt-2">
              <StarRating rating={operator.rating} size="md" />
              <span className="text-sm text-muted-foreground">
                ({operator.reviewCount} recensioni)
              </span>
            </div>
          </div>

          {/* Contatti — griglia separata */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            {operator.email && (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/30">
                <Mail className="w-4 h-4 text-primary shrink-0" />
                <span className="text-xs text-muted-foreground truncate">{operator.email}</span>
              </div>
            )}
            {operator.phone && (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/30">
                <Phone className="w-4 h-4 text-primary shrink-0" />
                <span className="text-xs text-muted-foreground">{operator.phone}</span>
              </div>
            )}
            {operator.hireDate && (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/30">
                <Calendar className="w-4 h-4 text-primary shrink-0" />
                <span className="text-xs text-muted-foreground">
                  Dal {new Date(operator.hireDate).toLocaleDateString("it-IT")}
                </span>
              </div>
            )}
          </div>

          {/* Specializzazioni */}
          {operator.specializations && (
            <div className="flex flex-wrap gap-2 justify-center mb-5">
              {operator.specializations.split(",").map((spec) => (
                <Badge key={spec.trim()} variant="secondary" className="text-xs px-3 py-1">
                  {spec.trim()}
                </Badge>
              ))}
            </div>
          )}

          {/* Bio */}
          {operator.bio && (
            <div className="border-t border-border/30 pt-4">
              <p className="text-sm text-muted-foreground leading-relaxed text-center max-w-2xl mx-auto">
                {operator.bio}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistiche */}
      <div
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 animate-slide-up"
        style={{ animationDelay: "100ms" }}
      >
        <Card className="glass">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xl font-bold">{operator.stats.totalAppointments}</p>
              <p className="text-xs text-muted-foreground">Appuntamenti totali</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center">
              <Euro className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xl font-bold">
                &euro;{Math.round(operator.stats.revenue)}
              </p>
              <p className="text-xs text-muted-foreground">Revenue totale</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Star className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xl font-bold">
                {operator.rating > 0 ? operator.rating.toFixed(1) : "-"}
              </p>
              <p className="text-xs text-muted-foreground">Valutazione media</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 dark:bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400" />
            </div>
            <div>
              <p className="text-xl font-bold">{operator.stats.noShowRate}%</p>
              <p className="text-xs text-muted-foreground">Tasso no-show</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orario settimanale */}
        <Card
          className="glass animate-slide-up"
          style={{ animationDelay: "150ms" }}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-heading">
              <Clock className="w-5 h-5" /> Orario Settimanale
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6, 0].map((day) => {
                const schedule = scheduleByDay.get(day)
                return (
                  <div
                    key={day}
                    className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <span className="font-medium text-sm w-24">
                      {dayNames[day]}
                    </span>
                    {schedule ? (
                      <Badge variant="secondary" className="font-mono">
                        {schedule.startTime} - {schedule.endTime}
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground italic">
                        Riposo
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Prossimi appuntamenti */}
        <Card
          className="glass animate-slide-up"
          style={{ animationDelay: "200ms" }}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-heading">
              <Calendar className="w-5 h-5" /> Prossimi Appuntamenti
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nessun appuntamento in programma
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingAppointments.map((apt) => (
                  <Link
                    key={apt.id}
                    href={`/prenotazioni/${apt.id}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div className="space-y-0.5">
                        <p className="font-medium text-sm">
                          {apt.service.name}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <User className="w-3 h-3" />
                          <span>{apt.user.name || "Cliente"}</span>
                        </div>
                      </div>
                      <div className="text-right space-y-0.5">
                        <p className="text-sm font-mono">
                          {new Date(apt.date).toLocaleDateString("it-IT", {
                            day: "2-digit",
                            month: "short",
                          })}{" "}
                          {apt.startTime}
                        </p>
                        <Badge
                          variant="secondary"
                          className={`text-xs ${statusColors[apt.status] || ""}`}
                        >
                          {statusLabels[apt.status] || apt.status}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* CTA Prenota */}
      <Card className="glass border-primary/20 animate-slide-up" style={{ animationDelay: "200ms" }}>
        <CardContent className="p-4 flex items-center gap-4">
          <div className="flex-1">
            <p className="font-heading font-bold">Prenota con {operator.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Scegli il servizio e la data che preferisci</p>
          </div>
          <Link href={`/prenotazioni/nuova`}>
            <Button className="gap-1.5 shrink-0">
              <Calendar className="w-4 h-4" /> Prenota
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Portfolio */}
      {portfolio.length > 0 && (
        <Card className="glass animate-slide-up" style={{ animationDelay: "220ms" }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" /> Portfolio Lavori
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PortfolioGallery items={portfolio} />
          </CardContent>
        </Card>
      )}

      {/* Recensioni recenti */}
      <Card
        className="glass animate-slide-up"
        style={{ animationDelay: "250ms" }}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-heading">
            <Star className="w-5 h-5" /> Recensioni Recenti
          </CardTitle>
        </CardHeader>
        <CardContent>
          {operator.reviews.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nessuna recensione ancora
            </p>
          ) : (
            <div className="space-y-4">
              {operator.reviews.map((review) => (
                <div
                  key={review.id}
                  className="p-4 rounded-lg border space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        {review.user.image && (
                          <AvatarImage src={review.user.image} />
                        )}
                        <AvatarFallback className="text-xs">
                          {review.user.name?.[0]?.toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">
                          {review.user.name || "Cliente"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {review.appointment.service.name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <StarRating rating={review.rating} size="sm" />
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(review.createdAt).toLocaleDateString("it-IT")}
                      </p>
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {review.comment}
                    </p>
                  )}
                  {review.reply && (
                    <div className="ml-6 p-3 rounded-lg bg-muted/50 border-l-2 border-primary/30">
                      <p className="text-xs font-medium text-primary mb-1">
                        Risposta del salone
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {review.reply}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
