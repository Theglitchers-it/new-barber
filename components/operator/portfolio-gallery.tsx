"use client"

import { BeforeAfterSlider } from "@/components/ui/before-after-slider"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Camera } from "lucide-react"

interface PortfolioItem {
  id: string
  beforeImage: string | null
  afterImage: string
  caption: string | null
  service: { name: string } | null
  createdAt: string
}

export function PortfolioGallery({ items }: { items: PortfolioItem[] }) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <Camera className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
        <p className="text-sm text-muted-foreground">Nessun lavoro nel portfolio</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {items.map((item, i) => (
        <Card key={item.id} className="glass border-0 overflow-hidden animate-fade-in hover-lift" style={{ animationDelay: `${i * 60}ms` }}>
          {item.beforeImage ? (
            <BeforeAfterSlider
              beforeSrc={item.beforeImage}
              afterSrc={item.afterImage}
              className="aspect-[4/3]"
            />
          ) : (
            <div className="relative aspect-[4/3]">
              <img
                src={item.afterImage}
                alt={item.caption || "Lavoro"}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          )}
          <CardContent className="p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium truncate">{item.caption || "Lavoro"}</p>
              {item.service && (
                <Badge variant="secondary" className="text-[10px] shrink-0">
                  {item.service.name}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
