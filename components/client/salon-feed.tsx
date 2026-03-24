"use client"

import useEmblaCarousel from "embla-carousel-react"
import { useCallback, useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface FeedSlide {
  before: string
  after: string
  caption: string
  operator: string
}

const SLIDES: FeedSlide[] = [
  { before: "photo-1580618672591-eb180b1a973f", after: "photo-1605497788044-5a32c7078486", caption: "Trasformazione colore", operator: "Marco Bianchi" },
  { before: "photo-1519699047748-de8e457a634e", after: "photo-1492106087820-71f1a00d2b11", caption: "Taglio moderno", operator: "Laura Verdi" },
  { before: "photo-1503951914875-452162b0f3f1", after: "photo-1521590832167-7bcbfaa6381f", caption: "Styling uomo", operator: "Marco Bianchi" },
]

export function SalonFeed() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" })
  const [selectedIndex, setSelectedIndex] = useState(0)

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    emblaApi.on("select", onSelect)
    onSelect()
    return () => { emblaApi.off("select", onSelect) }
  }, [emblaApi, onSelect])

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Novità</span>
          <h3 className="text-sm font-heading font-bold">Dal Tuo Salone</h3>
        </div>
      </div>

      <div ref={emblaRef} className="overflow-hidden rounded-xl">
        <div className="flex -ml-2">
          {SLIDES.map((slide, i) => (
            <div key={i} className="flex-none basis-[85%] sm:basis-[70%] pl-2">
              <div className="relative aspect-[16/9] rounded-xl overflow-hidden group">
                {/* After image (result) as main visible */}
                <img
                  src={`https://images.unsplash.com/${slide.after}?w=500&h=280&fit=crop`}
                  alt={slide.caption}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
                <div className="absolute bottom-2 left-2.5 right-2.5">
                  <p className="text-xs font-semibold text-white">{slide.caption}</p>
                  <p className="text-[10px] text-white/70">di {slide.operator}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-1">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => emblaApi?.scrollTo(i)}
            className={cn(
              "w-1.5 h-1.5 rounded-full transition-all duration-300",
              i === selectedIndex ? "w-3.5 bg-primary" : "bg-muted-foreground/30"
            )}
          />
        ))}
      </div>
    </div>
  )
}
