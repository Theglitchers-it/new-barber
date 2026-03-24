"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  Gift, TrendingUp, Trophy, Crown, Star,
  Shield, Award, Gem, Sparkles, Heart, Euro, Zap, Lock,
  Users, Loader2, Search, Plus, Minus,
} from "lucide-react"
import Link from "next/link"
import { LOYALTY_TIER_CONFIG, LOYALTY_TYPE } from "@/lib/constants"

type Transaction = {
  id: string
  points: number
  type: string
  reason: string
  createdAt: string
  appointment?: { id: string; date: string; service: { name: string } } | null
  order?: { id: string; total: number } | null
}

type LeaderboardEntry = {
  id: string
  name: string | null
  email: string
  loyaltyPoints: number
  loyaltyTier: string
  totalSpent: number
}

type UserLoyalty = {
  points: number
  tier: string
  totalPointsEarned: number
  totalVisits: number
  totalSpent: number
  transactions: Transaction[]
}

const tierIcons: Record<string, typeof Shield> = {
  BRONZE: Shield,
  SILVER: Award,
  GOLD: Crown,
  PLATINUM: Gem,
}

const badgeDefinitions = [
  { id: "first_visit", label: "Prima Visita", icon: Sparkles, threshold: 1, type: "visits" as const },
  { id: "regular", label: "Abituale", icon: Heart, threshold: 5, type: "visits" as const },
  { id: "vip", label: "VIP", icon: Crown, threshold: 10, type: "visits" as const },
  { id: "ambassador", label: "Ambasciatore", icon: Award, threshold: 25, type: "visits" as const },
  { id: "big_spender", label: "Big Spender", icon: Euro, threshold: 500, type: "spent" as const },
]

export default function FedeltaPage() {
  const { data: session, status } = useSession()
  const isAdmin = session?.user?.role === "ADMIN"
  const [loyalty, setLoyalty] = useState<UserLoyalty>({
    points: 0, tier: "BRONZE", totalPointsEarned: 0, totalVisits: 0, totalSpent: 0, transactions: [],
  })
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [redeemPoints, setRedeemPoints] = useState("")
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [adminTab, setAdminTab] = useState<"classifica" | "transazioni">("classifica")

  useEffect(() => {
    if (status !== "authenticated" && status !== "unauthenticated") return
    const controller = new AbortController()

    fetch("/api/loyalty", { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        setLoyalty({
          points: data.points ?? 0,
          tier: data.tier ?? "BRONZE",
          totalPointsEarned: data.totalPointsEarned ?? 0,
          totalVisits: data.totalVisits ?? 0,
          totalSpent: data.totalSpent ?? 0,
          transactions: data.transactions ?? [],
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))

    if (isAdmin) {
      fetch("/api/loyalty/leaderboard", { signal: controller.signal })
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => { if (Array.isArray(data)) setLeaderboard(data) })
        .catch(() => {})
    }

    return () => controller.abort()
  }, [isAdmin, status])

  const handleRedeem = useCallback(async () => {
    const pts = parseInt(redeemPoints)
    if (!pts || pts <= 0) { toast.error("Inserisci un numero valido"); return }
    if (pts > loyalty.points) { toast.error("Punti insufficienti"); return }

    try {
      const res = await fetch("/api/loyalty/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points: pts }),
      })
      if (res.ok) {
        const data = await res.json()
        setLoyalty((prev) => ({ ...prev, points: data.points, transactions: [data.transaction, ...prev.transactions] }))
        setRedeemPoints("")
        toast.success(`${pts} punti riscattati!`)
      } else {
        const err = await res.json()
        toast.error(err.error || "Errore")
      }
    } catch { toast.error("Errore di connessione") }
  }, [redeemPoints, loyalty.points])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const tierConfig = LOYALTY_TIER_CONFIG[loyalty.tier] || LOYALTY_TIER_CONFIG.BRONZE
  const nextTierKey = tierConfig.nextTier
  const nextTierConfig = nextTierKey ? LOYALTY_TIER_CONFIG[nextTierKey] : null
  const progressToNext = nextTierConfig
    ? Math.min(100, Math.round(((loyalty.totalPointsEarned - tierConfig.threshold) / (nextTierConfig.threshold - tierConfig.threshold)) * 100))
    : 100
  const pointsToNext = nextTierConfig ? nextTierConfig.threshold - loyalty.totalPointsEarned : 0
  const TierIcon = tierIcons[loyalty.tier] || Shield

  // Admin filtered leaderboard
  const filteredLeaderboard = searchQuery
    ? leaderboard.filter((c) =>
        (c.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : leaderboard

  // Admin stats
  const totalActivePoints = leaderboard.reduce((sum, c) => sum + c.loyaltyPoints, 0)
  const tierCounts = leaderboard.reduce((acc, c) => {
    const tier = c.loyaltyTier || "BRONZE"
    acc[tier] = (acc[tier] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // ═══════ ADMIN VIEW ═══════
  if (isAdmin) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-extrabold">
              <span className="gradient-text">Programma Fedeltà</span>
            </h1>
            <p className="text-muted-foreground mt-1">Gestisci punti, livelli e premi</p>
          </div>
          <Link href="/impostazioni">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Zap className="w-3.5 h-3.5" /> Configura Punti
            </Button>
          </Link>
        </div>

        {/* Admin Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="glass border-0">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-lg font-heading font-extrabold">{leaderboard.length}</p>
                <p className="text-[10px] text-muted-foreground">Clienti attivi</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass border-0">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Star className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <p className="text-lg font-heading font-extrabold">{totalActivePoints.toLocaleString("it-IT")}</p>
                <p className="text-[10px] text-muted-foreground">Punti in circolo</p>
              </div>
            </CardContent>
          </Card>
          {Object.entries(LOYALTY_TIER_CONFIG).slice(2).map(([key, config]) => {
            const Icon = tierIcons[key] || Shield
            return (
              <Card key={key} className="glass border-0">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${config.color}20` }}>
                    <Icon className="w-4 h-4" style={{ color: config.color }} />
                  </div>
                  <div>
                    <p className="text-lg font-heading font-extrabold">{tierCounts[key] || 0}</p>
                    <p className="text-[10px] text-muted-foreground">{config.label}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Tier Distribution Bar */}
        {leaderboard.length > 0 && (
          <div className="flex h-2 rounded-full overflow-hidden">
            {Object.entries(LOYALTY_TIER_CONFIG).map(([key, config]) => {
              const count = tierCounts[key] || 0
              const pct = (count / leaderboard.length) * 100
              return pct > 0 ? (
                <div key={key} style={{ width: `${pct}%`, background: config.color }} title={`${config.label}: ${count}`} />
              ) : null
            })}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1.5">
          {([["classifica", "Classifica", Trophy], ["transazioni", "Transazioni", TrendingUp]] as const).map(([key, label, Icon]) => (
            <Button
              key={key}
              variant={adminTab === key ? "default" : "outline"}
              size="sm"
              className="text-xs gap-1.5"
              onClick={() => setAdminTab(key)}
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </Button>
          ))}
        </div>

        {/* Classifica Tab */}
        {adminTab === "classifica" && (
          <Card className="glass border-0">
            <CardContent className="p-4">
              {/* Search */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  aria-label="Cerca cliente"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cerca cliente..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-accent/5 border border-border/20 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                {filteredLeaderboard.map((client, index) => {
                  const clientTier = LOYALTY_TIER_CONFIG[client.loyaltyTier || "BRONZE"] || LOYALTY_TIER_CONFIG.BRONZE
                  const ClientTierIcon = tierIcons[client.loyaltyTier || "BRONZE"] || Shield
                  return (
                    <div key={client.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-accent/5 transition-colors">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                        {index < 3 ? (
                          <Crown className={cn("w-4 h-4", index === 0 ? "text-amber-500" : index === 1 ? "text-slate-400" : "text-orange-400")} />
                        ) : (
                          <span className="text-muted-foreground">{index + 1}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{client.name || client.email}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge className="text-[9px] px-1.5 py-0 gap-0.5" style={{ background: clientTier.color, color: "white", border: "none" }}>
                            <ClientTierIcon className="w-2.5 h-2.5" /> {clientTier.label}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">€{client.totalSpent.toFixed(0)} spesi</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-heading font-bold text-sm">{client.loyaltyPoints}</p>
                        <p className="text-[9px] text-muted-foreground">punti</p>
                      </div>
                    </div>
                  )
                })}
                {filteredLeaderboard.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-6">
                    {searchQuery ? "Nessun cliente trovato" : "Nessun cliente con punti"}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Transazioni Tab */}
        {adminTab === "transazioni" && (
          <Card className="glass border-0">
            <CardContent className="p-4">
              {loyalty.transactions.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">Nessuna transazione</p>
              ) : (
                <div className="space-y-1.5">
                  {loyalty.transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/5 transition-colors">
                      <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", tx.type === LOYALTY_TYPE.EARNED ? "bg-green-500/10" : "bg-red-500/10")}>
                        {tx.type === LOYALTY_TYPE.EARNED ? <Plus className="w-3.5 h-3.5 text-green-500" /> : <Minus className="w-3.5 h-3.5 text-red-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{tx.reason}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(tx.createdAt).toLocaleDateString("it-IT", { day: "numeric", month: "short" })}
                        </p>
                      </div>
                      <span className={cn("font-bold text-sm", tx.points > 0 ? "text-green-500" : "text-red-500")}>
                        {tx.points > 0 ? "+" : ""}{tx.points}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  // ═══════ CLIENT VIEW ═══════
  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-extrabold">
          <span className="gradient-text">Programma Fedeltà</span>
        </h1>
        <p className="text-muted-foreground mt-1">Il tuo livello, i tuoi premi</p>
      </div>

      {/* Tier Hero — compatto */}
      <Card className="glass overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shrink-0"
              style={{ background: tierConfig.color }}
            >
              <TierIcon className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Badge style={{ background: tierConfig.color, color: "white", border: "none" }} className="text-[10px] font-bold">
                  {tierConfig.label}
                </Badge>
                <span className="text-[10px] text-muted-foreground">{tierConfig.multiplier}x punti · {tierConfig.discount > 0 ? `${Math.round(tierConfig.discount * 100)}% sconto` : "Nessuno sconto"}</span>
              </div>
              <p className="text-3xl font-extrabold gradient-text">{loyalty.points}</p>
              <p className="text-xs text-muted-foreground -mt-0.5">punti disponibili</p>
            </div>
          </div>

          {/* Progress */}
          {nextTierConfig && (
            <div className="mt-3">
              <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                <span>{tierConfig.label}</span>
                <span>{pointsToNext > 0 ? `${pointsToNext} pt al ${nextTierConfig.label}` : nextTierConfig.label}</span>
              </div>
              <Progress value={progressToNext} className="h-1.5" />
            </div>
          )}
          {!nextTierConfig && (
            <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
              <Gem className="w-3 h-3" /> Livello massimo raggiunto!
            </p>
          )}

          {/* Redeem inline */}
          <div className="mt-3 pt-3 border-t border-border/30 flex gap-2">
            <Input
              type="number"
              placeholder="Punti da riscattare"
              value={redeemPoints}
              onChange={(e) => setRedeemPoints(e.target.value)}
              min={1}
              max={loyalty.points}
              className="h-9 text-sm"
            />
            <Button onClick={handleRedeem} disabled={!redeemPoints || parseInt(redeemPoints) <= 0} size="sm" className="shrink-0 gap-1">
              <Gift className="w-3.5 h-3.5" /> Riscatta
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tier Roadmap + Badges — affiancati */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Tiers */}
        <Card className="glass border-0">
          <CardContent className="p-3">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-2">Livelli</p>
            <div className="grid grid-cols-4 gap-1.5">
              {Object.entries(LOYALTY_TIER_CONFIG).map(([key, config]) => {
                const Icon = tierIcons[key] || Shield
                const unlocked = loyalty.totalPointsEarned >= config.threshold
                const current = loyalty.tier === key
                return (
                  <div
                    key={key}
                    className={cn(
                      "relative p-2 rounded-xl text-center transition-all",
                      current ? "ring-2 ring-primary bg-primary/5" : unlocked ? "bg-muted/50" : "opacity-40"
                    )}
                  >
                    {!unlocked && <Lock className="w-2.5 h-2.5 absolute top-1 right-1 text-muted-foreground" />}
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-1" style={{ background: unlocked ? config.color : undefined }}>
                      <Icon className={cn("w-4 h-4", unlocked ? "text-white" : "text-muted-foreground")} />
                    </div>
                    <p className="text-[10px] font-bold">{config.label}</p>
                    <p className="text-[9px] text-muted-foreground">{config.threshold}+ pt</p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Badges */}
        <Card className="glass border-0">
          <CardContent className="p-3">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-2">Badge</p>
            <div className="grid grid-cols-5 gap-1.5">
              {badgeDefinitions.map((badge) => {
                const value = badge.type === "visits" ? loyalty.totalVisits : loyalty.totalSpent
                const unlocked = value >= badge.threshold
                return (
                  <div key={badge.id} className={cn("p-2 rounded-xl text-center transition-all", unlocked ? "bg-primary/10" : "opacity-30")}>
                    <badge.icon className={cn("w-5 h-5 mx-auto mb-0.5", unlocked ? "text-primary" : "text-muted-foreground")} />
                    <p className="text-[8px] font-bold leading-tight">{badge.label}</p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions */}
      <Card className="glass border-0">
        <CardContent className="p-3">
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-2">Storico</p>
          {loyalty.transactions.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-6">Nessuna transazione ancora</p>
          ) : (
            <div className="space-y-1">
              {loyalty.transactions.slice(0, 10).map((tx) => (
                <div key={tx.id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-accent/5 transition-colors">
                  <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center", tx.type === LOYALTY_TYPE.EARNED ? "bg-green-500/10" : "bg-red-500/10")}>
                    {tx.type === LOYALTY_TYPE.EARNED ? <Plus className="w-3 h-3 text-green-500" /> : <Minus className="w-3 h-3 text-red-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{tx.reason}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleDateString("it-IT", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <span className={cn("font-bold text-xs", tx.points > 0 ? "text-green-500" : "text-red-500")}>
                    {tx.points > 0 ? "+" : ""}{tx.points}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
