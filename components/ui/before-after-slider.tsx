"use client"

import { useRef, useState, useCallback } from "react"
import { ChevronsLeftRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface BeforeAfterSliderProps {
  beforeSrc: string
  afterSrc: string
  beforeLabel?: string
  afterLabel?: string
  className?: string
}

export function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  beforeLabel = "PRIMA",
  afterLabel = "DOPO",
  className,
}: BeforeAfterSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const [position, setPosition] = useState(50)

  const updatePosition = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = clientX - rect.left
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100))
    setPosition(pct)
  }, [])

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    dragging.current = true
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    updatePosition(e.clientX)
  }, [updatePosition])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return
    updatePosition(e.clientX)
  }, [updatePosition])

  const onPointerUp = useCallback(() => {
    dragging.current = false
  }, [])

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") setPosition((p) => Math.max(0, p - 5))
    else if (e.key === "ArrowRight") setPosition((p) => Math.min(100, p + 5))
  }, [])

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden rounded-2xl select-none group", className)}
      style={{ touchAction: "none" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      role="slider"
      aria-valuenow={Math.round(position)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Confronto prima e dopo"
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      {/* After image (base layer) */}
      <img
        src={afterSrc}
        alt={afterLabel}
        className="w-full h-full object-cover"
        draggable={false}
      />

      {/* Before image (clipped overlay) */}
      <img
        src={beforeSrc}
        alt={beforeLabel}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        draggable={false}
      />

      {/* Divider line */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white/80 shadow-lg"
        style={{ left: `${position}%`, transform: "translateX(-50%)" }}
      >
        {/* Handle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full glass flex items-center justify-center cursor-grab active:cursor-grabbing shadow-lg border border-white/30">
          <ChevronsLeftRight className="w-4 h-4 text-foreground" />
        </div>
      </div>

      {/* Labels */}
      <span className="absolute bottom-3 left-3 glass px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest opacity-80">
        {beforeLabel}
      </span>
      <span className="absolute bottom-3 right-3 glass px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest opacity-80">
        {afterLabel}
      </span>
    </div>
  )
}
