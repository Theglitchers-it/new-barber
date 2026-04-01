"use client"

import { useState } from "react"
import { PASSWORD_MIN_LENGTH } from "@/lib/validations/auth"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { StarRating } from "@/components/ui/star-rating"
import { AnimatedCounter } from "@/components/ui/animated-counter"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet"
import { toast } from "sonner"
import {
  Calendar,
  Gift,
  Star,
  Clock,
  ShoppingBag,
  Scissors,
  Heart,
  ArrowRight,
  User,
  Lock,
  Save,
  Settings,
} from "lucide-react"
import Link from "next/link"
import {
  appointmentStatusLabels,
  appointmentStatusColors,
  orderStatusLabels,
  orderStatusColors,
  LOYALTY_TIER_CONFIG,
  calculateTier,
} from "@/lib/constants"
import { useRevealOnScroll } from "@/hooks/use-reveal-on-scroll"

type ProfileStats = {
  user: {
    name: string | null
    email: string
    phone: string | null
    hairType: string | null
    avatar: string | null
    loyaltyPoints: number
    totalSpent: number
  }
  stats: {
    totalAppointments: number
    averageRating: number
    memberSince: string
  }
  nextAppointment: {
    id: string
    date: string
    startTime: string
    endTime: string
    status: string
    service: { name: string; duration: number }
    operator: { name: string }
  } | null
  recentAppointments: Array<{
    id: string
    date: string
    startTime: string
    status: string
    totalPrice: number
    service: { name: string }
    operator: { name: string }
  }>
  recentOrders: Array<{
    id: string
    total: number
    status: string
    createdAt: string
    items: Array<{ product: { name: string }; quantity: number }>
  }>
  loyalty: {
    points: number
    recentTransactions: Array<{
      id: string
      points: number
      type: string
      reason: string
      createdAt: string
    }>
  }
  reviews: Array<{
    id: string
    rating: number
    comment: string | null
    reply: string | null
    createdAt: string
    operator: { name: string }
    appointment: { date: string; service: { name: string } }
  }>
  favorites: { service: string | null; operator: string | null }
  recommendedProducts: Array<{
    id: string
    name: string
    price: number
    originalPrice: number | null
    image: string | null
    category: string
  }>
}

function getCountdown(dateStr: string): { label: string; number: string; unit: string; color: string } {
  const date = new Date(dateStr)
  const now = new Date()
  date.setHours(0, 0, 0, 0)
  now.setHours(0, 0, 0, 0)
  const days = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (days <= 0) return { label: "Oggi", number: "!", unit: "oggi", color: "text-emerald-600 dark:text-emerald-400" }
  if (days === 1) return { label: "Domani", number: "1", unit: "giorno", color: "text-amber-600 dark:text-amber-400" }
  return { label: `Tra ${days} giorni`, number: String(days), unit: "giorni", color: "text-primary" }
}

function getTierProgress(points: number) {
  const tier = calculateTier(points)
  const config = LOYALTY_TIER_CONFIG[tier]
  if (!config.nextTier) return { percent: 100, pointsToNext: 0, nextLabel: null }
  const nextConfig = LOYALTY_TIER_CONFIG[config.nextTier]
  const range = nextConfig.threshold - config.threshold
  const progress = points - config.threshold
  return {
    percent: Math.min(100, Math.round((progress / range) * 100)),
    pointsToNext: nextConfig.threshold - points,
    nextLabel: nextConfig.label,
  }
}

export function ProfiloClient({
  initialData,
  initialProfile,
}: {
  initialData: ProfileStats
  initialProfile: { preferredContact: string | null; notes: string | null; birthDate: string | null }
}) {
  const { user, stats, nextAppointment, recentAppointments, recentOrders, loyalty, reviews, favorites, recommendedProducts } = initialData

  useRevealOnScroll()

  // Profile form state
  const [name, setName] = useState(user.name ?? "")
  const [phone, setPhone] = useState(user.phone ?? "")
  const [hairType, setHairType] = useState(user.hairType ?? "")
  const [preferredContact, setPreferredContact] = useState(initialProfile.preferredContact ?? "")
  const [notes, setNotes] = useState(initialProfile.notes ?? "")
  const [birthDate, setBirthDate] = useState(initialProfile.birthDate ?? "")
  const [saving, setSaving] = useState(false)

  // Password state
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [changingPassword, setChangingPassword] = useState(false)

  const tier = calculateTier(user.loyaltyPoints)
  const tierConfig = LOYALTY_TIER_CONFIG[tier]
  const tierProgress = getTierProgress(user.loyaltyPoints)
  const firstName = (user.name ?? "").split(" ")[0] || "Utente"
  const memberDate = new Date(stats.memberSince)
  const memberLabel = memberDate.toLocaleDateString("it-IT", { month: "long", year: "numeric" })
  const initials = (user.name ?? "?").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, hairType, preferredContact, notes, birthDate: birthDate || null }),
      })
      if (res.ok) {
        toast.success("Profilo aggiornato")
      } else {
        const data = await res.json()
        toast.error(data.error || "Errore nel salvataggio")
      }
    } catch {
      toast.error("Errore nel salvataggio")
    }
    setSaving(false)
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Le password non corrispondono")
      return
    }
    if (newPassword.length < PASSWORD_MIN_LENGTH) {
      toast.error(`La password deve avere almeno ${PASSWORD_MIN_LENGTH} caratteri`)
      return
    }
    setChangingPassword(true)
    try {
      const res = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      if (res.ok) {
        toast.success("Password aggiornata")
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      } else {
        const data = await res.json()
        toast.error(data.error || "Errore nel cambio password")
      }
    } catch {
      toast.error("Errore nel cambio password")
    }
    setChangingPassword(false)
  }

  // Combine recent activity
  const recentActivity = [
    ...recentAppointments.map((a) => ({
      type: "appointment" as const,
      id: a.id,
      title: a.service.name,
      subtitle: a.operator.name,
      date: a.date,
      status: a.status,
      link: `/prenotazioni/${a.id}`,
    })),
    ...recentOrders.map((o) => ({
      type: "order" as const,
      id: o.id,
      title: o.items.map((i) => i.product.name).join(", "),
      subtitle: `€${o.total.toFixed(2)}`,
      date: o.createdAt,
      status: o.status,
      link: `/ordini/${o.id}`,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)

  return (
    <div className="max-w-2xl mx-auto pb-12 animate-fade-in">
      {/* ═══ HERO IMMERSIVO ═══ */}
      <div className="relative rounded-3xl overflow-hidden px-4 sm:px-6 pt-8 sm:pt-12 pb-6 sm:pb-8 text-center mb-4 sm:mb-6"
        style={{ background: `linear-gradient(135deg, ${tierConfig.color}12, ${tierConfig.color}04)` }}
      >
        {/* Decorative floating blobs */}
        <div className="absolute top-6 right-8 w-20 h-20 rounded-full float-slow opacity-40"
          style={{ background: `${tierConfig.color}10` }}
        />
        <div className="absolute bottom-10 left-6 w-14 h-14 rounded-full float-slow opacity-30"
          style={{ background: `${tierConfig.color}08`, animationDelay: "2s" }}
        />

        {/* Avatar */}
        <Avatar className="w-20 h-20 sm:w-28 sm:h-28 mx-auto ring-4 ring-background shadow-2xl animate-bounce-in">
          <AvatarFallback
            className="text-2xl sm:text-4xl font-bold"
            style={{ background: `linear-gradient(135deg, ${tierConfig.color}30, ${tierConfig.color}10)`, color: tierConfig.color }}
          >
            {initials}
          </AvatarFallback>
        </Avatar>

        {/* Name with shimmer */}
        <h1 className="text-2xl sm:text-3xl font-heading font-bold mt-4 sm:mt-5 gradient-text-animated">
          Ciao, {firstName}
        </h1>

        {/* Tier badge */}
        <div className="flex justify-center mt-3">
          <Badge
            variant="secondary"
            className="animate-pop px-4 py-1.5 text-sm font-semibold glass"
            style={{ borderColor: tierConfig.color, color: tierConfig.color }}
          >
            {tierConfig.label}
          </Badge>
        </div>

        {/* Tier progress */}
        {tierProgress.nextLabel && (
          <div className="mt-5 max-w-xs mx-auto">
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>{tierConfig.label}</span>
              <span>{tierProgress.nextLabel}</span>
            </div>
            <Progress value={tierProgress.percent} className="h-1.5" />
            <p className="text-center text-xs text-muted-foreground mt-1.5">
              {tierProgress.pointsToNext} punti al prossimo livello
            </p>
          </div>
        )}

        {/* Warm member line */}
        <p className="text-sm text-muted-foreground mt-4">
          Con noi da {memberLabel} &middot; {stats.totalAppointments} visite insieme
        </p>

        <div className="divider-gradient mt-6" />
      </div>

      {/* ═══ PROSSIMO APPUNTAMENTO ═══ */}
      <div className="px-1 mb-6 animate-slide-up" style={{ animationDelay: "50ms" }}>
        {nextAppointment ? (() => {
          const countdown = getCountdown(nextAppointment.date)
          return (
            <Link href={`/prenotazioni/${nextAppointment.id}`}>
              <div className="glow-card glass rounded-2xl p-5 hover-lift">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex flex-col items-center justify-center shrink-0">
                    <span className={`text-xl font-bold ${countdown.color}`}>{countdown.number}</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{countdown.unit}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-bold text-lg">{nextAppointment.service.name}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">con {nextAppointment.operator.name}</p>
                    <p className="text-sm mt-1">
                      {new Date(nextAppointment.date).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })} &middot; {nextAppointment.startTime}
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-primary mt-1 shrink-0" />
                </div>
              </div>
            </Link>
          )
        })() : (
          <Link href="/prenotazioni/nuova">
            <div className="glass-gradient rounded-2xl p-6 text-center hover-lift">
              <Scissors className="w-8 h-8 text-primary mx-auto animate-float" />
              <p className="font-heading font-semibold mt-3">Prenota il tuo momento</p>
              <p className="text-sm text-muted-foreground mt-1">Scegli quando dedicarti a te</p>
              <Button className="mt-4 rounded-xl btn-gradient">
                Prenota ora <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </Link>
        )}
      </div>

      {/* ═══ BENTO GRID ═══ */}
      <div className="px-1 mb-6 sm:mb-8 reveal reveal-stagger">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {/* Il tuo stile */}
          <div className="reveal glass rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-primary" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Il tuo stile</span>
            </div>
            {user.hairType && (
              <Badge variant="secondary" className="text-xs capitalize">{user.hairType}</Badge>
            )}
            {favorites.service && (
              <p className="text-sm"><span className="text-muted-foreground">Servizio: </span><span className="font-medium">{favorites.service}</span></p>
            )}
            {favorites.operator && (
              <p className="text-sm"><span className="text-muted-foreground">Con: </span><span className="font-medium">{favorites.operator}</span></p>
            )}
            {!user.hairType && !favorites.service && !favorites.operator && (
              <p className="text-xs text-muted-foreground">I tuoi preferiti appariranno qui</p>
            )}
          </div>

          {/* Punti fedeltà */}
          <Link href="/fedelta">
            <div className="reveal glass rounded-2xl p-4 text-center hover-lift h-full flex flex-col items-center justify-center">
              <Gift className="w-5 h-5 text-primary" />
              <p className="text-3xl font-bold mt-2 gradient-text">
                <AnimatedCounter value={loyalty.points} />
              </p>
              <p className="text-xs text-muted-foreground mt-1">Punti fedeltà</p>
            </div>
          </Link>

          {/* Visite */}
          <div className="reveal glass rounded-2xl p-4 text-center">
            <Calendar className="w-5 h-5 mx-auto text-blue-600 dark:text-blue-400" />
            <p className="text-3xl font-bold mt-2">
              <AnimatedCounter value={stats.totalAppointments} />
            </p>
            <p className="text-xs text-muted-foreground mt-1">Visite</p>
          </div>

          {/* Rating */}
          <div className="reveal glass rounded-2xl p-4 text-center">
            <Star className="w-5 h-5 mx-auto text-amber-500" />
            <p className="text-3xl font-bold mt-2">
              {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "—"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">La tua media</p>
          </div>

          {/* Quick re-book CTA */}
          {favorites.operator && (
            <Link href="/prenotazioni/nuova" className="col-span-2 sm:col-span-4">
              <div className="reveal glass-gradient rounded-2xl p-4 flex items-center gap-4 hover-lift">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Scissors className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">Prenota con {favorites.operator}</p>
                  <p className="text-xs text-muted-foreground">Il tuo servizio preferito ti aspetta</p>
                </div>
                <ArrowRight className="w-5 h-5 text-primary shrink-0" />
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* ═══ PER TE — PRODOTTI CONSIGLIATI ═══ */}
      {recommendedProducts.length > 0 && (
        <div className="px-1 mb-6 sm:mb-8 reveal">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-heading font-semibold gradient-text">Per te</h2>
            <Link href="/shop">
              <Button variant="ghost" size="sm" className="text-xs text-primary">
                Vedi tutti <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {recommendedProducts.map((product) => (
              <Link key={product.id} href={`/shop/${product.id}`}>
                <div className="glass rounded-2xl overflow-hidden hover-lift group">
                  <div className="aspect-square bg-muted relative overflow-hidden">
                    {product.image && product.image !== "/placeholder.jpg" ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 gradient-bg-subtle flex items-center justify-center">
                        <ShoppingBag className="w-8 h-8 text-muted-foreground/30" />
                      </div>
                    )}
                    {product.originalPrice && (
                      <span className="absolute top-1.5 left-1.5 gradient-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                        -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                      </span>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{product.category}</p>
                    <p className="text-sm font-semibold mt-0.5 line-clamp-1">{product.name}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-sm font-bold gradient-text">&euro;{product.price.toFixed(2)}</span>
                      {product.originalPrice && (
                        <span className="text-[10px] text-muted-foreground line-through">&euro;{product.originalPrice.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ═══ TIMELINE — LA TUA STORIA ═══ */}
      {recentActivity.length > 0 && (
        <div className="px-1 mb-8 reveal">
          <h2 className="text-lg font-heading font-semibold mb-4 gradient-text">La tua storia</h2>

          <div className="relative pl-6">
            {/* Vertical timeline line */}
            <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary/30 via-secondary/20 to-transparent rounded-full" />

            <div className="space-y-3 stagger-children">
              {recentActivity.map((item) => (
                <Link key={`${item.type}-${item.id}`} href={item.link}>
                  <div className="relative group">
                    {/* Timeline dot */}
                    <div className={`absolute -left-6 top-3.5 w-3 h-3 rounded-full border-2 border-background transition-transform group-hover:scale-125 ${
                      item.type === "appointment" ? "bg-primary" : "bg-secondary"
                    }`} />

                    {/* Event card */}
                    <div className="glass-subtle rounded-2xl p-3.5 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            {item.type === "appointment"
                              ? <Scissors className="w-3.5 h-3.5 text-primary shrink-0" />
                              : <ShoppingBag className="w-3.5 h-3.5 text-secondary shrink-0" />
                            }
                            <p className="text-sm font-medium truncate">{item.title}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 ml-5.5">{item.subtitle}</p>
                        </div>
                        <div className="text-right shrink-0 space-y-0.5">
                          <p className="text-xs text-muted-foreground">
                            {new Date(item.date).toLocaleDateString("it-IT", { day: "2-digit", month: "short" })}
                          </p>
                          <Badge variant="secondary" className={`text-[10px] ${
                            item.type === "appointment"
                              ? appointmentStatusColors[item.status] || ""
                              : orderStatusColors[item.status] || ""
                          }`}>
                            {item.type === "appointment"
                              ? appointmentStatusLabels[item.status] || item.status
                              : orderStatusLabels[item.status] || item.status
                            }
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="text-center mt-4">
            <Link href="/prenotazioni">
              <Button variant="ghost" size="sm" className="text-xs text-primary">
                Tutta la tua storia <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* ═══ RECENSIONI — LE TUE PAROLE ═══ */}
      {reviews.length > 0 && (
        <div className="px-1 mb-6 sm:mb-8 reveal">
          <h2 className="text-lg font-heading font-semibold mb-3 sm:mb-4">Le tue parole</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
            {reviews.slice(0, 4).map((review) => (
              <div key={review.id} className="glass rounded-2xl p-4 sm:p-5 space-y-2.5 sm:space-y-3">
                <div className="flex items-center justify-between">
                  <StarRating rating={review.rating} size="sm" />
                  <span className="text-xs text-muted-foreground">
                    {new Date(review.createdAt).toLocaleDateString("it-IT", { day: "2-digit", month: "short" })}
                  </span>
                </div>
                <p className="text-sm font-medium">{review.appointment.service.name}</p>
                {review.comment && (
                  <p className="text-sm text-muted-foreground italic line-clamp-3">
                    &ldquo;{review.comment}&rdquo;
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  con {review.operator.name}
                </p>
                {review.reply && (
                  <div className="p-2.5 rounded-lg bg-muted/50 border-l-2 border-primary/30">
                    <p className="text-xs text-muted-foreground">{review.reply}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ MODIFICA PROFILO — BOTTOM SHEET ═══ */}
      <div className="reveal px-1 pb-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full rounded-2xl gap-2 h-12 text-muted-foreground hover:text-foreground border-border/30">
              <Settings className="w-4 h-4" />
              Modifica profilo
            </Button>
          </SheetTrigger>

          <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto px-6 pb-[calc(2rem+env(safe-area-inset-bottom))]">
            <SheetHeader>
              <SheetTitle className="font-heading text-lg">Il tuo profilo</SheetTitle>
              <SheetDescription>Gestisci le tue informazioni personali</SheetDescription>
            </SheetHeader>

            <div className="space-y-5 pt-2">
              {/* Email read-only */}
              <div className="glass-subtle rounded-xl p-3 text-sm text-muted-foreground flex items-center gap-2">
                <User className="w-4 h-4" />
                {user.email}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs">Nome</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs">Telefono</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tipo di capelli</Label>
                  <Select value={hairType} onValueChange={setHairType}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Seleziona" /></SelectTrigger>
                    <SelectContent>
                      {["Lisci", "Mossi", "Ricci", "Crespi", "Sottili", "Spessi"].map((t) => (
                        <SelectItem key={t} value={t.toLowerCase()}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Contatto preferito</Label>
                  <Select value={preferredContact} onValueChange={setPreferredContact}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Seleziona" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EMAIL">Email</SelectItem>
                      <SelectItem value="PHONE">Telefono</SelectItem>
                      <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="birthDate" className="text-xs">Data di nascita</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes" className="text-xs">Note personali</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Allergie, preferenze, richieste speciali..."
                  className="rounded-xl resize-none"
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-xs gap-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      Cambia password
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Cambia password</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Password attuale</Label>
                        <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="rounded-xl" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Nuova password</Label>
                        <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="rounded-xl" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Conferma password</Label>
                        <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="rounded-xl" />
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="ghost" size="sm">Annulla</Button>
                      </DialogClose>
                      <Button onClick={handleChangePassword} disabled={changingPassword} size="sm" className="rounded-xl">
                        {changingPassword ? "Aggiornamento..." : "Aggiorna"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Button onClick={handleSaveProfile} disabled={saving} className="rounded-xl btn-gradient gap-2 w-full sm:w-auto min-h-[44px]">
                  <Save className="w-4 h-4" />
                  {saving ? "Salvataggio..." : "Salva modifiche"}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
