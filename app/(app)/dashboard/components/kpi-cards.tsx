"use client"

import { AreaChart, Area, ResponsiveContainer } from "recharts"
import {
  TrendingUp, TrendingDown, Minus,
  Calendar, Users, Euro, Star, AlertTriangle, CheckCircle, Gift, ShoppingBag,
} from "lucide-react"
import { AnimatedCounter } from "@/components/ui/animated-counter"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const iconMap: Record<string, React.ElementType> = {
  Calendar, Users, Euro, Star, AlertTriangle, CheckCircle, Gift, ShoppingBag,
}

export interface KpiData {
  label: string
  value: number
  prefix?: string
  suffix?: string
  decimals?: number
  iconName: string
  gradient: string
  sparklineData: number[]
  trend?: number
}

interface KpiCardsProps {
  kpis: KpiData[]
}

export function KpiCards({ kpis }: KpiCardsProps) {
  return (
    <>
      {/* Mobile: show first 4 KPIs in 2x2 grid */}
      <div className="grid grid-cols-2 gap-2 md:hidden">
        {kpis.slice(0, 4).map((kpi) => (
          <KpiCard key={kpi.label} kpi={kpi} />
        ))}
      </div>
      {/* Desktop: show all 8 KPIs in 4-column grid */}
      <div className="hidden md:grid md:grid-cols-4 gap-3">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} kpi={kpi} />
        ))}
      </div>
    </>
  )
}

function KpiCard({ kpi }: { kpi: KpiData }) {
  const {
    label,
    value,
    prefix,
    suffix,
    decimals,
    iconName,
    gradient,
    sparklineData,
    trend,
  } = kpi

  const Icon = iconMap[iconName] || Calendar

  const chartData = sparklineData.map((v, i) => ({ i, v }))

  return (
    <Card className="glass hover-lift p-0 border-0 gap-0">
      <CardContent className="p-3">
        {/* Top: Icon + Label */}
        <div className="flex items-center gap-2 mb-1.5">
          <div
            className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center",
              gradient
            )}
          >
            <Icon className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium leading-tight">
            {label}
          </span>
        </div>

        {/* Middle: Value */}
        <AnimatedCounter
          value={value}
          prefix={prefix}
          suffix={suffix}
          decimals={decimals}
          className="text-lg font-extrabold leading-tight"
        />

        {/* Bottom: Sparkline + Trend */}
        <div className="flex items-end justify-between mt-1.5">
          <div className="flex-1 h-7">
            <ResponsiveContainer width="100%" height={28}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id={`sparkFill-${label}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke="hsl(var(--primary))"
                  strokeWidth={1.5}
                  fill={`url(#sparkFill-${label})`}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <TrendBadge trend={trend} />
        </div>
      </CardContent>
    </Card>
  )
}

function TrendBadge({ trend }: { trend?: number }) {
  if (trend === undefined || trend === 0) {
    return (
      <span className="ml-2 flex items-center gap-0.5 text-[10px] text-muted-foreground shrink-0">
        <Minus className="w-3 h-3" />
        <span>0%</span>
      </span>
    )
  }

  if (trend > 0) {
    return (
      <span className="ml-2 flex items-center gap-0.5 text-[10px] text-emerald-500 shrink-0">
        <TrendingUp className="w-3 h-3" />
        <span>+{Math.abs(trend).toFixed(1)}%</span>
      </span>
    )
  }

  return (
    <span className="ml-2 flex items-center gap-0.5 text-[10px] text-red-500 shrink-0">
      <TrendingDown className="w-3 h-3" />
      <span>-{Math.abs(trend).toFixed(1)}%</span>
    </span>
  )
}
