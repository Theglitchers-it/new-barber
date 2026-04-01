"use client"

import { useEffect, useCallback, useState } from "react"
import Image from "next/image"
import useEmblaCarousel from "embla-carousel-react"
import { cn } from "@/lib/utils"

interface TrendingStyle {
  src: string
  tag: string
}

const STYLES: TrendingStyle[] = [
  { src: "photo-1522337360788-8b13dee7a37e", tag: "Balayage" },
  { src: "photo-1560066984-138dadb4c035", tag: "Bob Cut" },
  { src: "photo-1595476108010-b4d1f102b1b1", tag: "Pixie" },
  { src: "photo-1633681926022-84c23e8cb2d6", tag: "Colore Fantasia" },
  { src: "photo-1503951914875-452162b0f3f1", tag: "Onde Morbide" },
  { src: "photo-1521590832167-7bcbfaa6381f", tag: "Taglio Moderno" },
]

export function TrendingStylesCarousel() {
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

    // Auto-play
    const interval = setInterval(() => emblaApi.scrollNext(), 4000)
    return () => {
      clearInterval(interval)
      emblaApi.off("select", onSelect)
    }
  }, [emblaApi, onSelect])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Tendenze</span>
          <h3 className="text-base font-heading font-bold">Stili del Momento</h3>
        </div>
      </div>

      <div ref={emblaRef} className="overflow-hidden rounded-2xl">
        <div className="flex -ml-3">
          {STYLES.map((style, i) => (
            <div
              key={style.src}
              className="flex-none basis-[45%] sm:basis-[35%] md:basis-[28%] pl-3"
            >
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden group">
                <Image
                  src={`https://images.unsplash.com/${style.src}?w=400&h=530&fit=crop`}
                  alt={style.tag}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 640px) 45vw, (max-width: 768px) 35vw, 28vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
                <span className="absolute bottom-3 left-3 glass px-2.5 py-1 rounded-lg text-xs font-bold">
                  {style.tag}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-1.5">
        {STYLES.map((_, i) => (
          <button
            key={i}
            onClick={() => emblaApi?.scrollTo(i)}
            className={cn(
              "w-1.5 h-1.5 rounded-full transition-all duration-300",
              i === selectedIndex ? "w-4 bg-primary" : "bg-muted-foreground/30"
            )}
          />
        ))}
      </div>
    </div>
  )
}
