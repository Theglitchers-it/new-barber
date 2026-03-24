"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"

interface RevenueChartProps {
  data: { label: string; revenue: number }[]
}

const COLORS = [
  "#e05a3a",
  "#3b82f6",
  "#a3a3b0",
  "#34d399",
  "#f59e0b",
]

const tooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
}

const tooltipStyleWithShadow = {
  ...tooltipStyle,
  boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
}

const formatRevenue = (value: number) => [`€${value}`, "Ricavo"]
const formatTick = (v: number) => `€${v}`
const formatServiceTooltip = (value: number, name: string) => [value, name]
const formatLegend = (value: string) => (
  <span style={{ color: "hsl(var(--foreground))", fontSize: 12 }}>
    {value}
  </span>
)

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="label"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          stroke="hsl(var(--foreground))"
        />
        <YAxis
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={formatTick}
          stroke="hsl(var(--foreground))"
        />
        <Tooltip
          formatter={formatRevenue}
          contentStyle={tooltipStyleWithShadow}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="hsl(var(--foreground))"
          strokeWidth={2.5}
          fill="url(#revenueGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

interface ServiceDistributionProps {
  data: { name: string; count: number; revenue: number }[]
}

export function ServiceDistributionChart({ data }: ServiceDistributionProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[250px] text-muted-foreground">
        Nessun dato disponibile
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="40%"
          innerRadius={45}
          outerRadius={75}
          paddingAngle={4}
          dataKey="count"
          nameKey="name"
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={formatServiceTooltip}
          contentStyle={tooltipStyle}
        />
        <Legend
          verticalAlign="bottom"
          align="center"
          iconType="circle"
          iconSize={8}
          formatter={formatLegend}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
