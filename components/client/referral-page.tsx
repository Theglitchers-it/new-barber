"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Users,
  Copy,
  Check,
  Gift,
  Trophy,
  Share2,
  Loader2,
  Star,
  Crown,
  Sparkles,
} from "lucide-react"
import { cn, copyToClipboard } from "@/lib/utils"
import { REFERRAL_STATUS } from "@/lib/constants"

interface ReferralData {
  referralCode: string
  stats: {
    total: number
    completed: number
    pointsEarned: number
  }
  referrals: Array<{
    id: string
    status: string
    createdAt: string
    referredName: string | null
    referredEmail: string | null
  }>
}

interface LeaderboardEntry {
  name: string
  referralCount: number
  avatar: string | null
}

export function ReferralPage({ userId, userName }: { userId: string; userName: string }) {
  const [data, setData] = useState<ReferralData | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [redeemCode, setRedeemCode] = useState("")
  const [redeemStatus, setRedeemStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [redeeming, setRedeeming] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch("/api/referral").then(r => r.json()),
      fetch("/api/referral/leaderboard").then(r => r.json()),
    ]).then(([referralData, leaderboardData]) => {
      setData(referralData)
      setLeaderboard(leaderboardData.leaderboard || [])
      setLoading(false)
    })
  }, [])

  const copyCode = async () => {
    if (!data) return
    await copyToClipboard(data.referralCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareReferral = async () => {
    if (!data) return
    const url = `${window.location.origin}/registrati?ref=${data.referralCode}`
    if (navigator.share) {
      await navigator.share({
        title: "Unisciti a SalonPro!",
        text: `Usa il mio codice ${data.referralCode} per ottenere 50 punti bonus!`,
        url,
      })
    } else {
      await copyToClipboard(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const shareWhatsApp = () => {
    if (!data) return
    const url = `${window.location.origin}/registrati?ref=${data.referralCode}`
    const text = encodeURIComponent(`Ciao! Ti invito a provare SalonPro, il mio salone di fiducia. Usa il mio codice ${data.referralCode} per ottenere 50 punti bonus! ${url}`)
    window.open(`https://wa.me/?text=${text}`, "_blank")
  }

  const handleRedeem = async () => {
    if (!redeemCode.trim()) return
    setRedeeming(true)
    setRedeemStatus(null)
    try {
      const res = await fetch("/api/referral/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: redeemCode.trim().toUpperCase() }),
      })
      const result = await res.json()
      if (res.ok) {
        setRedeemStatus({ type: "success", message: `Codice riscattato! Hai ricevuto ${result.pointsAwarded} punti bonus!` })
        setRedeemCode("")
        // Refresh data
        const updated = await fetch("/api/referral").then(r => r.json())
        setData(updated)
      } else {
        setRedeemStatus({ type: "error", message: result.error || "Errore nel riscatto" })
      }
    } finally {
      setRedeeming(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  const medals = ["🥇", "🥈", "🥉"]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Users className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-heading font-bold">Invita Amici</h1>
      </div>

      {/* Referral Code Card */}
      <Card className="overflow-hidden border-0">
        <div className="gradient-primary p-5 text-white">
          <div className="flex items-center gap-2 mb-1">
            <Gift className="w-5 h-5" />
            <span className="text-sm font-medium opacity-90">Il tuo codice</span>
          </div>
          <div className="flex items-center gap-3 mt-3">
            <span className="text-2xl font-heading font-black tracking-wider">
              {data?.referralCode}
            </span>
            <button
              onClick={copyCode}
              className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs opacity-80 mt-2">
            Tu ricevi <strong>100 punti</strong>, il tuo amico <strong>50 punti</strong>
          </p>
        </div>
      </Card>

      {/* Share Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={shareWhatsApp}
          className="bg-[#25D366] hover:bg-[#22c55e] text-white h-12 rounded-xl font-semibold"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          WhatsApp
        </Button>
        <Button
          onClick={shareReferral}
          variant="outline"
          className="h-12 rounded-xl font-semibold"
        >
          <Share2 className="w-4 h-4 mr-2" />
          Condividi
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center p-3">
          <p className="text-2xl font-heading font-bold text-primary">{data?.stats.total || 0}</p>
          <p className="text-[10px] text-muted-foreground font-medium">Invitati</p>
        </Card>
        <Card className="text-center p-3">
          <p className="text-2xl font-heading font-bold text-green-500">{data?.stats.completed || 0}</p>
          <p className="text-[10px] text-muted-foreground font-medium">Completati</p>
        </Card>
        <Card className="text-center p-3">
          <p className="text-2xl font-heading font-bold text-amber-500">{data?.stats.pointsEarned || 0}</p>
          <p className="text-[10px] text-muted-foreground font-medium">Punti Vinti</p>
        </Card>
      </div>

      {/* Redeem Code */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <p className="text-sm font-semibold">Hai un codice invito?</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={redeemCode}
              onChange={e => setRedeemCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === "Enter" && handleRedeem()}
              placeholder="Es. MARIA7K2X"
              className="flex-1 text-sm bg-muted rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30 uppercase tracking-wider font-mono"
              maxLength={12}
            />
            <Button
              onClick={handleRedeem}
              disabled={!redeemCode.trim() || redeeming}
              className="rounded-xl"
            >
              {redeeming ? <Loader2 className="w-4 h-4 animate-spin" /> : "Riscatta"}
            </Button>
          </div>
          {redeemStatus && (
            <p className={cn(
              "text-xs font-medium",
              redeemStatus.type === "success" ? "text-green-500" : "text-destructive"
            )}>
              {redeemStatus.message}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Leaderboard */}
      {leaderboard.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-heading font-bold">Top Referrer</h2>
          </div>
          <Card>
            <CardContent className="p-0 divide-y divide-border/50">
              {leaderboard.map((entry, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <span className="text-lg w-7 text-center">
                    {i < 3 ? medals[i] : <span className="text-xs text-muted-foreground font-bold">{i + 1}</span>}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                    {entry.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{entry.name}</p>
                  </div>
                  <div className="flex items-center gap-1 text-primary">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span className="text-sm font-bold">{entry.referralCount}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Referrals */}
      {data?.referrals && data.referrals.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-heading font-bold">I Tuoi Inviti</h2>
          <Card>
            <CardContent className="p-0 divide-y divide-border/50">
              {data.referrals.map(ref => (
                <div key={ref.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                    {ref.referredName?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{ref.referredName || ref.referredEmail || "In attesa..."}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(ref.createdAt).toLocaleDateString("it-IT")}
                    </p>
                  </div>
                  <span className={cn(
                    "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                    ref.status === REFERRAL_STATUS.COMPLETED ? "bg-green-500/10 text-green-500" :
                    ref.status === REFERRAL_STATUS.PENDING ? "bg-amber-500/10 text-amber-500" :
                    "bg-muted text-muted-foreground"
                  )}>
                    {ref.status === REFERRAL_STATUS.COMPLETED ? "Completato" : ref.status === REFERRAL_STATUS.PENDING ? "In attesa" : "Scaduto"}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
