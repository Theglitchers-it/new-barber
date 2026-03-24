"use client"

import { getSeasonalConfig } from "@/lib/seasonal"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

export function SeasonalBanner() {
  const config = getSeasonalConfig()
  const Icon = config.icon

  return (
    <div className={cn("relative overflow-hidden rounded-2xl bg-gradient-to-r p-4", config.gradient)}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-background/60 backdrop-blur-sm flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            {config.label}
          </p>
          <p className="text-sm font-heading font-bold mt-0.5">{config.headline}</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {config.description}
          </p>
          <Link
            href="/prenotazioni/nuova"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary mt-2 hover:underline"
          >
            Prenota ora <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  )
}
