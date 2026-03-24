"use client"

import { Scissors, Palette, Droplets, Calendar } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface TimelineEntry {
  id: string
  beforePhoto: string | null
  afterPhoto: string | null
  service: string
  operator: string
  notes: string | null
  colorFormula: string | null
  productsUsed: string | null
  createdAt: string
}

function getServiceIcon(service: string) {
  const lower = service.toLowerCase()
  if (lower.includes("colore") || lower.includes("meches") || lower.includes("balayage")) return Palette
  if (lower.includes("trattamento") || lower.includes("cheratina")) return Droplets
  return Scissors
}

export function HairTimeline({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <Scissors className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
        <p className="font-heading font-bold">Nessuna visita registrata</p>
        <p className="text-sm text-muted-foreground mt-1">La tua storia capelli apparirà qui dopo ogni appuntamento</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-5 top-0 bottom-0 w-px bg-border/50" />

      <div className="space-y-4">
        {entries.map((entry, i) => {
          const Icon = getServiceIcon(entry.service)
          const date = new Date(entry.createdAt)

          return (
            <div key={entry.id} className="relative pl-12 animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
              {/* Timeline dot */}
              <div className="absolute left-3 w-5 h-5 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center z-10">
                <Icon className="w-2.5 h-2.5 text-primary" />
              </div>

              <Card className="glass border-0 hover-lift">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-heading font-bold text-sm">{entry.service}</p>
                      <p className="text-xs text-muted-foreground">con {entry.operator}</p>
                    </div>
                    <Badge variant="secondary" className="text-[10px] shrink-0 gap-1">
                      <Calendar className="w-2.5 h-2.5" />
                      {date.toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" })}
                    </Badge>
                  </div>

                  {/* Photos */}
                  {(entry.beforePhoto || entry.afterPhoto) && (
                    <div className="flex gap-2 mb-3">
                      {entry.beforePhoto && (
                        <div className="flex-1 relative aspect-[4/3] rounded-xl overflow-hidden">
                          <img src={entry.beforePhoto} alt="Prima" className="w-full h-full object-cover" />
                          <span className="absolute bottom-1 left-1 glass px-1.5 py-0.5 rounded text-[9px] font-bold">PRIMA</span>
                        </div>
                      )}
                      {entry.afterPhoto && (
                        <div className="flex-1 relative aspect-[4/3] rounded-xl overflow-hidden">
                          <img src={entry.afterPhoto} alt="Dopo" className="w-full h-full object-cover" />
                          <span className="absolute bottom-1 right-1 glass px-1.5 py-0.5 rounded text-[9px] font-bold">DOPO</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Details */}
                  <div className="space-y-1">
                    {entry.colorFormula && (
                      <div className="flex items-center gap-2">
                        <Palette className="w-3 h-3 text-muted-foreground shrink-0" />
                        <p className="text-xs text-muted-foreground">Formula: <span className="text-foreground font-medium">{entry.colorFormula}</span></p>
                      </div>
                    )}
                    {entry.productsUsed && (
                      <div className="flex items-center gap-2">
                        <Droplets className="w-3 h-3 text-muted-foreground shrink-0" />
                        <p className="text-xs text-muted-foreground">Prodotti: <span className="text-foreground font-medium">{entry.productsUsed}</span></p>
                      </div>
                    )}
                    {entry.notes && (
                      <p className="text-xs text-muted-foreground italic mt-1">{entry.notes}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )
        })}
      </div>
    </div>
  )
}
