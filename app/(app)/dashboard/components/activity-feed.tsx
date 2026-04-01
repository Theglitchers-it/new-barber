"use client"

import { useState } from "react"
import { Calendar, Star, ShoppingBag, Activity, ArrowRight, ChevronDown, ChevronUp } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { it } from "date-fns/locale"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface ActivityItem {
  id: string
  type: "appointment" | "review" | "order"
  description: string
  timestamp: string
  link?: string
}

interface ActivityFeedProps {
  items: ActivityItem[]
}

const iconConfig = {
  appointment: {
    icon: Calendar,
    className: "bg-primary/10 text-primary",
    label: "Prenotazione",
  },
  review: {
    icon: Star,
    className: "bg-amber-500/10 text-amber-500",
    label: "Recensione",
  },
  order: {
    icon: ShoppingBag,
    className: "bg-green-500/10 text-green-500",
    label: "Ordine",
  },
}

const COLLAPSED_COUNT = 4

export function ActivityFeed({ items }: ActivityFeedProps) {
  const [expanded, setExpanded] = useState(false)
  const allItems = items.slice(0, 10)
  const visibleItems = expanded ? allItems : allItems.slice(0, COLLAPSED_COUNT)
  const hasMore = allItems.length > COLLAPSED_COUNT

  return (
    <Card className="glass">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-heading">
          <Activity className="h-4 w-4" />
          Attività Recente
          {allItems.length > 0 && (
            <Badge variant="secondary" className="ml-auto text-[10px]">
              {allItems.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {allItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Activity className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm">Nessuna attività recente</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[19px] top-3 bottom-3 w-px bg-border/50" />
            <div className="space-y-1">
              {visibleItems.map((item, index) => {
                const { icon: Icon, className: iconClassName, label } = iconConfig[item.type]

                const content = (
                  <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent/5 transition-all duration-200 group relative">
                    <div
                      className={cn("flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full ring-2 ring-background relative z-10", iconClassName)}
                    >
                      <Icon className="h-3 w-3" />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
                          {label}
                        </span>
                        <span className="text-[10px] text-muted-foreground/40">·</span>
                        <span className="text-[10px] text-muted-foreground/60">
                          {formatDistanceToNow(new Date(item.timestamp), {
                            addSuffix: true,
                            locale: it,
                          })}
                        </span>
                      </div>
                      <p className="text-sm leading-snug">{item.description}</p>
                    </div>
                    {item.link && (
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-foreground/50 transition-all mt-1 shrink-0 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5" />
                    )}
                  </div>
                )

                return item.link ? (
                  <Link key={item.id} href={item.link}>
                    {content}
                  </Link>
                ) : (
                  <div key={item.id}>{content}</div>
                )
              })}
            </div>
            {hasMore && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5 mr-1.5" />
                    Mostra meno
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5 mr-1.5" />
                    Mostra tutte ({allItems.length})
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
