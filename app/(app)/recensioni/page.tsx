"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { StarRating } from "@/components/ui/star-rating"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { MessageSquare, Eye, EyeOff, Send, Star, Users } from "lucide-react"

type Review = {
  id: string
  rating: number
  comment: string | null
  reply: string | null
  replyDate: string | null
  visible: boolean
  createdAt: string
  user: { id: string; name: string | null; email: string }
  operator: { id: string; name: string }
  appointment: { id: string; date: string; service: { name: string } }
}

type Stats = {
  average: number
  total: number
  distribution: Record<number, number>
}

type Operator = {
  id: string
  name: string
}

export default function RecensioniPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [operators, setOperators] = useState<Operator[]>([])
  const [filterRating, setFilterRating] = useState<string>("")
  const [filterOperator, setFilterOperator] = useState<string>("")
  const [replyText, setReplyText] = useState<Record<string, string>>({})
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchReviews = async () => {
    const params = new URLSearchParams()
    if (filterRating && filterRating !== "all") params.set("rating", filterRating)
    if (filterOperator && filterOperator !== "all") params.set("operatorId", filterOperator)

    const res = await fetch(`/api/reviews?${params}`)
    const data = await res.json()
    setReviews(data)
  }

  const fetchStats = async () => {
    const res = await fetch("/api/reviews/stats")
    const data = await res.json()
    setStats(data)
  }

  useEffect(() => {
    Promise.all([
      fetchReviews(),
      fetchStats(),
      fetch("/api/operators").then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json() }).then(setOperators),
    ]).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchReviews()
  }, [filterRating, filterOperator])

  const handleReply = async (reviewId: string) => {
    const text = replyText[reviewId]
    if (!text?.trim()) return

    const res = await fetch(`/api/reviews/${reviewId}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply: text }),
    })

    if (res.ok) {
      toast.success("Risposta inviata")
      setReplyingTo(null)
      setReplyText((prev) => ({ ...prev, [reviewId]: "" }))
      fetchReviews()
    } else {
      toast.error("Errore nell'invio della risposta")
    }
  }

  const toggleVisibility = async (reviewId: string) => {
    const res = await fetch(`/api/reviews/${reviewId}/visibility`, {
      method: "PATCH",
    })

    if (res.ok) {
      toast.success("Visibilità aggiornata")
      fetchReviews()
      fetchStats()
    } else {
      toast.error("Errore nell'aggiornamento")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <div>
        <h1 className="text-3xl font-heading font-extrabold gradient-text">
          Recensioni
        </h1>
        <p className="text-muted-foreground mt-1">
          Gestisci e modera le recensioni dei clienti
        </p>
      </div>

      {/* Statistiche */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br gradient-primary text-white">
                  <Star className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Media</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{stats.average}</span>
                    <StarRating rating={stats.average} size="sm" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-secondary to-secondary/70 text-white">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Totale recensioni</p>
                  <span className="text-2xl font-bold">{stats.total}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground font-medium">Distribuzione</p>
                {[5, 4, 3, 2, 1].map((star) => (
                  <div key={star} className="flex items-center gap-2 text-sm">
                    <span className="w-3">{star}</span>
                    <Star className="w-3 h-3 fill-primary text-primary" />
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r gradient-primary rounded-full transition-all"
                        style={{
                          width: stats.total > 0
                            ? `${(stats.distribution[star] / stats.total) * 100}%`
                            : "0%",
                        }}
                      />
                    </div>
                    <span className="w-6 text-right text-muted-foreground">
                      {stats.distribution[star]}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtri */}
      <Card className="glass">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Select value={filterRating} onValueChange={setFilterRating}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtra per stelle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte le stelle</SelectItem>
                  <SelectItem value="5">5 stelle</SelectItem>
                  <SelectItem value="4">4 stelle</SelectItem>
                  <SelectItem value="3">3 stelle</SelectItem>
                  <SelectItem value="2">2 stelle</SelectItem>
                  <SelectItem value="1">1 stella</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Select value={filterOperator} onValueChange={setFilterOperator}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtra per operatore" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti gli operatori</SelectItem>
                  {operators.map((op) => (
                    <SelectItem key={op.id} value={op.id}>
                      {op.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista recensioni */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <Card className="glass">
            <CardContent className="py-12 text-center">
              <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Nessuna recensione trovata</p>
            </CardContent>
          </Card>
        ) : (
          reviews.map((review) => (
            <Card key={review.id} className={`glass ${!review.visible ? "opacity-60" : ""}`}>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-medium">
                        {review.user.name || review.user.email}
                      </span>
                      <StarRating rating={review.rating} size="sm" />
                      <Badge variant="outline">{review.operator.name}</Badge>
                      {!review.visible && (
                        <Badge variant="secondary">Nascosta</Badge>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {review.appointment.service.name} -{" "}
                      {new Date(review.appointment.date).toLocaleDateString("it-IT", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>

                    {review.comment && (
                      <p className="text-sm">{review.comment}</p>
                    )}

                    {review.reply && (
                      <div className="ml-4 pl-4 border-l-2 border-primary mt-3">
                        <p className="text-sm font-medium text-secondary">Risposta del salone</p>
                        <p className="text-sm text-muted-foreground">{review.reply}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {review.replyDate &&
                            new Date(review.replyDate).toLocaleDateString("it-IT")}
                        </p>
                      </div>
                    )}

                    {replyingTo === review.id && (
                      <div className="mt-3 space-y-2">
                        <Textarea
                          placeholder="Scrivi la tua risposta..."
                          value={replyText[review.id] || ""}
                          onChange={(e) =>
                            setReplyText((prev) => ({
                              ...prev,
                              [review.id]: e.target.value,
                            }))
                          }
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleReply(review.id)}
                            className="btn-gradient"
                          >
                            <Send className="w-3 h-3 mr-1" /> Invia
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setReplyingTo(null)}
                          >
                            Annulla
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {!review.reply && replyingTo !== review.id && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setReplyingTo(review.id)}
                      >
                        <MessageSquare className="w-3 h-3 mr-1" /> Rispondi
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleVisibility(review.id)}
                    >
                      {review.visible ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mt-3">
                  {new Date(review.createdAt).toLocaleDateString("it-IT", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
