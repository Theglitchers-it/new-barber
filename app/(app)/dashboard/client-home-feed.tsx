import { prisma } from "@/lib/prisma"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Calendar,
  Gift,
  ArrowRight,
  Plus,
  CheckCircle,
  ShoppingBag,
  Scissors,
  Flame,
} from "lucide-react"
import Link from "next/link"
import { APPOINTMENT_STATUS, LOYALTY_TIER_CONFIG } from "@/lib/constants"
import { SuggestedProducts } from "./suggested-products"
import { TrendingStylesCarousel } from "@/components/client/trending-styles-carousel"
import { SalonFeed } from "@/components/client/salon-feed"
import { SeasonalBanner } from "@/components/client/seasonal-banner"

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Buongiorno"
  if (hour < 18) return "Buon pomeriggio"
  return "Buonasera"
}

function getTodayFormatted(): string {
  return new Date().toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
}

export async function ClientHomeFeed({ userId, userName }: { userId: string; userName: string }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [
    user,
    nextAppointment,
    pastAppointments,
    recentOrders,
    suggestedProducts,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { loyaltyPoints: true, loyaltyTier: true, currentStreak: true },
    }),
    prisma.appointment.findFirst({
      where: {
        userId,
        date: { gte: today },
        status: { in: [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.CONFIRMED] },
      },
      include: {
        service: { select: { name: true, duration: true } },
        operator: { select: { name: true } },
      },
      orderBy: { date: "asc" },
    }),
    prisma.appointment.findMany({
      where: { userId, status: APPOINTMENT_STATUS.COMPLETED },
      include: {
        service: { select: { name: true } },
        operator: { select: { name: true } },
        review: { select: { id: true } },
      },
      orderBy: { date: "desc" },
      take: 3,
    }),
    prisma.order.findMany({
      where: { userId },
      select: {
        id: true,
        total: true,
        status: true,
        createdAt: true,
        items: {
          select: { quantity: true, product: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.product.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        price: true,
        originalPrice: true,
        image: true,
        rating: true,
        reviewCount: true,
        stock: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ])

  const loyaltyPoints = user?.loyaltyPoints || 0
  const loyaltyTier = user?.loyaltyTier || "BRONZE"
  const loyaltyMilestone = Math.ceil((loyaltyPoints + 1) / 500) * 500
  const loyaltyProgress = loyaltyMilestone > 0 ? Math.round((loyaltyPoints / loyaltyMilestone) * 100) : 0

  const tierBadgeClasses: Record<string, string> = {
    BRONZE: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    SILVER: "bg-slate-100 text-slate-600 dark:bg-slate-800/30 dark:text-slate-400",
    GOLD: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    PLATINUM: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  }

  // Smart rebooking suggestion
  let smartSuggestion: { message: string; serviceName: string; operatorName: string; daysUntil: number } | null = null
  if (pastAppointments.length >= 2) {
    const dates = pastAppointments.map((a) => new Date(a.date).getTime()).sort((a, b) => a - b)
    const intervals: number[] = []
    for (let i = 1; i < dates.length; i++) {
      intervals.push(Math.round((dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24)))
    }
    const avgInterval = Math.round(intervals.reduce((s, v) => s + v, 0) / intervals.length)
    const lastDate = new Date(Math.max(...dates))
    const nextDate = new Date(lastDate)
    nextDate.setDate(nextDate.getDate() + avgInterval)
    const now = new Date(); now.setHours(0, 0, 0, 0)
    if (nextDate < now) nextDate.setTime(now.getTime())
    const daysUntil = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    const topService = pastAppointments[0].service.name
    const topOp = pastAppointments[0].operator.name

    let message: string
    if (daysUntil <= 0) message = "È il momento perfetto per prenotare!"
    else if (daysUntil <= 3) message = `Il tuo prossimo appuntamento è tra ${daysUntil} giorni`
    else if (daysUntil <= 7) message = "Ti consigliamo di prenotare entro questa settimana"
    else message = `Prossimo appuntamento consigliato tra ${daysUntil} giorni`

    smartSuggestion = { message, serviceName: topService, operatorName: topOp, daysUntil }
  }

  const greeting = getGreeting()
  const todayDate = getTodayFormatted()
  const firstName = userName.split(" ")[0]

  return (
    <div className="space-y-4 stagger-children">
      {/* 1. Saluto + Azioni rapide */}
      <div className="pt-2">
        <h1 className="text-2xl md:text-3xl font-heading font-extrabold">
          {greeting}, <span className="gradient-text">{firstName}</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1 capitalize">{todayDate}</p>
        <div className="flex gap-2 mt-3">
          <Link href="/prenotazioni/nuova" className="flex-1">
            <Button className="w-full gap-2 h-11 font-semibold">
              <Plus className="w-4 h-4" /> Prenota
            </Button>
          </Link>
          <Link href="/shop" className="flex-1">
            <Button variant="outline" className="w-full gap-2 h-11 font-semibold">
              <ShoppingBag className="w-4 h-4" /> Shop
            </Button>
          </Link>
        </div>
      </div>

      {/* Seasonal Banner */}
      <SeasonalBanner />

      {/* Trending Styles Carousel */}
      <TrendingStylesCarousel />

      {/* Smart Rebooking */}
      {smartSuggestion && !nextAppointment && (
        <Card className="glass border-primary/20 hover-lift">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Scissors className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold">{smartSuggestion.message}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {smartSuggestion.serviceName} con {smartSuggestion.operatorName}
              </p>
            </div>
            <Link href="/prenotazioni/nuova">
              <Button size="sm" className="shrink-0 text-xs h-8">Prenota</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* 2. Prossimo appuntamento */}
      {nextAppointment ? (
        <Card className="glass hover-lift">
          <CardContent className="p-4 md:p-5">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-3">Prossimo appuntamento</p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-heading font-bold">{nextAppointment.service.name}</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {new Date(nextAppointment.date).toLocaleDateString("it-IT", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-border/40 grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Orario</p>
                <p className="text-sm font-semibold mt-0.5">{nextAppointment.startTime}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Durata</p>
                <p className="text-sm font-semibold mt-0.5">{nextAppointment.service.duration} min</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Operatore</p>
                <p className="text-sm font-semibold mt-0.5 truncate">{nextAppointment.operator.name}</p>
              </div>
            </div>
            <div className="mt-3">
              <Link href={`/prenotazioni/${nextAppointment.id}`}>
                <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                  Vedi dettagli <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="glass">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <p className="font-heading font-bold">Nessun appuntamento</p>
            <p className="text-sm text-muted-foreground mt-1">Prenota il tuo prossimo trattamento</p>
            <Link href="/prenotazioni/nuova" className="inline-block mt-3">
              <Button size="sm" className="gap-1.5">
                <Plus className="w-4 h-4" /> Prenota ora
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* 3. Fedeltà + Visite — affiancati */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Fedeltà */}
        <Link href="/fedelta" className="block">
          <Card className="overflow-hidden hover-lift cursor-pointer border-0 shadow-sm h-full">
            <div className="px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Gift className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Fedeltà</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {(user?.currentStreak || 0) > 0 && (
                    <Badge className="text-[9px] px-1.5 py-0 bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                      <Flame className="w-2.5 h-2.5 mr-0.5" />{user?.currentStreak}
                    </Badge>
                  )}
                  <Badge className={`text-[9px] px-1.5 py-0 ${tierBadgeClasses[loyaltyTier] || tierBadgeClasses.BRONZE}`}>
                    {LOYALTY_TIER_CONFIG[loyaltyTier]?.label || loyaltyTier}
                  </Badge>
                </div>
              </div>
              <div className="flex items-baseline gap-1 mb-1.5">
                <span className="text-2xl font-heading font-extrabold gradient-text">{loyaltyPoints}</span>
                <span className="text-xs text-muted-foreground">punti</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted/60 overflow-hidden mb-1">
                <div className="h-full rounded-full gradient-primary transition-all duration-700" style={{ width: `${loyaltyProgress}%` }} />
              </div>
              <p className="text-[10px] text-muted-foreground">
                <span className="font-semibold text-primary">{loyaltyMilestone - loyaltyPoints}</span> punti al prossimo premio
              </p>
            </div>
          </Card>
        </Link>

        {/* Visite recenti */}
        <div>
          <div className="flex items-center justify-between mb-1.5 px-0.5">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Ultime visite</span>
            <Link href="/prenotazioni" className="text-[10px] text-primary font-medium hover:underline flex items-center gap-0.5">
              Tutte <ArrowRight className="w-2.5 h-2.5" />
            </Link>
          </div>
          {pastAppointments.length > 0 ? (
            <div className="space-y-1">
              {pastAppointments.map((apt) => (
                <div key={apt.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30">
                  <CheckCircle className="w-3 h-3 text-primary shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium truncate">{apt.service.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(apt.date).toLocaleDateString("it-IT", { day: "numeric", month: "short" })} &middot; &euro;{apt.totalPrice.toFixed(2)}
                    </p>
                  </div>
                  {apt.review ? (
                    <span className="text-[9px] text-primary">Recensito</span>
                  ) : (
                    <Link href={`/recensioni?appointmentId=${apt.id}`} className="text-[9px] text-muted-foreground hover:text-primary">
                      Recensisci
                    </Link>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground px-3 py-4 text-center">Nessuna visita</p>
          )}
        </div>
      </div>

      {/* Dal Tuo Salone Feed */}
      <SalonFeed />

      {/* Referral Promo Card */}
      <Link href="/referral" className="block">
        <Card className="overflow-hidden border-0 hover-lift cursor-pointer">
          <div className="gradient-primary p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 text-white">
              <p className="text-sm font-bold">Invita un amico, guadagna 100 punti!</p>
              <p className="text-[10px] opacity-80">Condividi il tuo codice e ricevi punti bonus</p>
            </div>
            <ArrowRight className="w-4 h-4 text-white/70 shrink-0" />
          </div>
        </Card>
      </Link>

      {/* 4. Prodotti suggeriti */}
      <SuggestedProducts products={suggestedProducts} />

      {/* 6. Ordini recenti */}
      {recentOrders.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-heading font-bold">Ordini recenti</h2>
            <Link href="/ordini" className="text-[10px] text-primary font-medium hover:underline flex items-center gap-1">
              Vedi tutti <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-1.5">
            {recentOrders.map((order) => (
              <Link key={order.id} href={`/ordini/${order.id}`} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">
                    {order.items.map((i) => i.product.name).join(", ")}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString("it-IT", { day: "numeric", month: "short" })} &middot; &euro;{order.total.toFixed(2)}
                  </p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
