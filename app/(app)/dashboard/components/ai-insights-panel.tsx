"use client"

import { useMemo } from "react"
import {
  Sparkles,
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  MessageSquare,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface AiInsightsPanelProps {
  noShowRate: number
  completionRate: number
  revenueData: { label: string; revenue: number }[]
  topServices: { name: string; count: number }[]
  totalAppointments: number
}

type InsightType = "warning" | "info" | "positive"

interface Insight {
  type: InsightType
  icon: React.ElementType
  text: string
  cta?: string
}

const borderColorMap: Record<InsightType, string> = {
  warning: "border-l-amber-500",
  info: "border-l-blue-500",
  positive: "border-l-green-500",
}

const iconColorMap: Record<InsightType, string> = {
  warning: "text-amber-500",
  info: "text-blue-500",
  positive: "text-green-500",
}

export function AiInsightsPanel({
  noShowRate,
  completionRate,
  revenueData,
  topServices,
  totalAppointments,
}: AiInsightsPanelProps) {
  const insights = useMemo(() => {
    const result: Insight[] = []

    // Rule 1: High no-show rate warning
    if (noShowRate > 15) {
      result.push({
        type: "warning",
        icon: AlertTriangle,
        text: `Il tasso di no-show è al ${Math.round(noShowRate)}%. Considera di inviare reminder SMS automatici il giorno prima.`,
        cta: "Configura reminder",
      })
    }

    // Rule 2: Lowest revenue day
    if (revenueData.length > 1) {
      const lowestDay = revenueData.reduce((min, curr) =>
        curr.revenue < min.revenue ? curr : min
      )
      result.push({
        type: "info",
        icon: TrendingUp,
        text: `Il ${lowestDay.label} è il giorno con meno incassi. Lancia una promozione per riempire gli slot!`,
        cta: "Crea promozione",
      })
    }

    // Rule 3: Dominant service
    if (topServices.length > 0 && totalAppointments > 0) {
      const topService = topServices[0]
      const percentage = (topService.count / totalAppointments) * 100
      if (percentage > 40) {
        result.push({
          type: "positive",
          icon: Lightbulb,
          text: `${topService.name} rappresenta il ${Math.round(percentage)}% dei servizi. Crea un pacchetto fedeltà dedicato!`,
          cta: "Crea pacchetto",
        })
      }
    }

    // Rule 4: Always show mock insight
    result.push({
      type: "info",
      icon: MessageSquare,
      text: "Alcuni clienti non visitano da oltre 60 giorni. Invia un messaggio personalizzato per farli tornare!",
      cta: "Invia messaggi",
    })

    return result.slice(0, 4)
  }, [noShowRate, revenueData, topServices, totalAppointments])

  return (
    <Card className="glass border border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">Suggerimenti AI</CardTitle>
        </div>
        <Badge variant="secondary" className="text-xs">
          Beta
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight, index) => {
          const Icon = insight.icon
          return (
            <div
              key={insight.text.slice(0, 20)}
              className={cn(
                "p-3 rounded-lg bg-muted/20 border-l-2 animate-in fade-in slide-in-from-left-2",
                borderColorMap[insight.type]
              )}
              style={{ animationDelay: `${index * 100}ms`, animationFillMode: "both" }}
            >
              <div className="flex items-start gap-2">
                <Icon
                  className={cn("w-4 h-4 mt-0.5 shrink-0", iconColorMap[insight.type])}
                />
                <div className="flex-1 space-y-1">
                  <p className="text-sm">{insight.text}</p>
                  {insight.cta && (
                    <button className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">
                      {insight.cta} &rarr;
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        <p className="text-xs text-muted-foreground text-center pt-2">
          ✨ Powered by AI · Analisi avanzate prossimamente
        </p>
      </CardContent>
    </Card>
  )
}
