"use client"

import { useRef, useState, useCallback, type ReactNode } from "react"
import { X, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface SwipeableCardProps {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  leftLabel?: string
  rightLabel?: string
  children: ReactNode
  className?: string
  disabled?: boolean
}

const THRESHOLD = 80

export function SwipeableCard({
  onSwipeLeft,
  onSwipeRight,
  leftLabel = "Annulla",
  rightLabel = "Conferma",
  children,
  className,
  disabled,
}: SwipeableCardProps) {
  const [deltaX, setDeltaX] = useState(0)
  const [swiping, setSwiping] = useState(false)
  const [animating, setAnimating] = useState<"left" | "right" | null>(null)
  const startX = useRef(0)
  const startY = useRef(0)
  const locked = useRef(false)

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || animating) return
    startX.current = e.touches[0].clientX
    startY.current = e.touches[0].clientY
    locked.current = false
    setSwiping(false)
  }, [disabled, animating])

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || animating) return

      const dx = e.touches[0].clientX - startX.current
      const dy = e.touches[0].clientY - startY.current

      // Lock direction after 10px
      if (!locked.current && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
        locked.current = true
        if (Math.abs(dy) > Math.abs(dx)) {
          // Vertical scroll, ignore
          startX.current = 0
          return
        }
        setSwiping(true)
      }

      if (!swiping && !locked.current) return
      if (startX.current === 0) return

      // Only allow swipe in directions with handlers
      if (dx < 0 && !onSwipeLeft) return
      if (dx > 0 && !onSwipeRight) return

      setDeltaX(dx)
    },
    [disabled, animating, swiping, onSwipeLeft, onSwipeRight]
  )

  const onTouchEnd = useCallback(() => {
    if (disabled || animating || !swiping) {
      setDeltaX(0)
      setSwiping(false)
      return
    }

    if (deltaX < -THRESHOLD && onSwipeLeft) {
      setAnimating("left")
      setTimeout(() => {
        onSwipeLeft()
        setAnimating(null)
        setDeltaX(0)
        setSwiping(false)
      }, 280)
    } else if (deltaX > THRESHOLD && onSwipeRight) {
      setAnimating("right")
      setTimeout(() => {
        onSwipeRight()
        setAnimating(null)
        setDeltaX(0)
        setSwiping(false)
      }, 280)
    } else {
      setDeltaX(0)
      setSwiping(false)
    }
  }, [disabled, animating, swiping, deltaX, onSwipeLeft, onSwipeRight])

  const progress = Math.min(Math.abs(deltaX) / THRESHOLD, 1)
  const isPastThreshold = Math.abs(deltaX) >= THRESHOLD

  return (
    <div className={cn("relative overflow-hidden rounded-xl", className)}>
      {/* Background indicators */}
      {(onSwipeLeft || onSwipeRight) && (
        <div className="absolute inset-0 flex items-center justify-between px-6 pointer-events-none">
          {onSwipeRight && (
            <div
              className={cn(
                "flex items-center gap-2 transition-opacity duration-150",
                deltaX > 0 ? "opacity-100" : "opacity-0"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                isPastThreshold && deltaX > 0 ? "bg-green-500 text-white" : "bg-green-500/20 text-green-500"
              )}>
                <Check className="w-5 h-5" />
              </div>
              <span className={cn(
                "text-xs font-semibold transition-colors",
                isPastThreshold && deltaX > 0 ? "text-green-500" : "text-muted-foreground"
              )}>
                {rightLabel}
              </span>
            </div>
          )}
          <div className="flex-1" />
          {onSwipeLeft && (
            <div
              className={cn(
                "flex items-center gap-2 transition-opacity duration-150",
                deltaX < 0 ? "opacity-100" : "opacity-0"
              )}
            >
              <span className={cn(
                "text-xs font-semibold transition-colors",
                isPastThreshold && deltaX < 0 ? "text-red-500" : "text-muted-foreground"
              )}>
                {leftLabel}
              </span>
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                isPastThreshold && deltaX < 0 ? "bg-red-500 text-white" : "bg-red-500/20 text-red-500"
              )}>
                <X className="w-5 h-5" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Card content */}
      <div
        className={cn(
          animating === "left" && "animate-swipe-out-left",
          animating === "right" && "animate-swipe-out-right"
        )}
        style={
          !animating && swiping
            ? {
                transform: `translateX(${deltaX}px)`,
                opacity: 1 - progress * 0.3,
                transition: "none",
              }
            : !animating
            ? { transform: "translateX(0)", transition: "transform 200ms ease-out, opacity 200ms ease-out" }
            : undefined
        }
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {children}
      </div>
    </div>
  )
}
