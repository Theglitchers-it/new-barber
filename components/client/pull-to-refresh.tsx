"use client"

import { useRef, useState, useCallback, type ReactNode } from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: ReactNode
  className?: string
}

type State = "idle" | "pulling" | "refreshing"

const THRESHOLD = 80
const MAX_PULL = 120

export function PullToRefresh({ onRefresh, children, className }: PullToRefreshProps) {
  const [state, setState] = useState<State>("idle")
  const [pullDistance, setPullDistance] = useState(0)
  const startY = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (containerRef.current && containerRef.current.scrollTop <= 0) {
      startY.current = e.touches[0].clientY
    }
  }, [])

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (state === "refreshing") return
      if (startY.current === 0) return

      const delta = e.touches[0].clientY - startY.current
      if (delta <= 0) {
        setPullDistance(0)
        return
      }

      // Dampen the pull distance
      const dampened = Math.min(delta * 0.5, MAX_PULL)
      setPullDistance(dampened)
      setState("pulling")
    },
    [state]
  )

  const onTouchEnd = useCallback(async () => {
    if (state === "refreshing") return

    if (pullDistance >= THRESHOLD) {
      setState("refreshing")
      setPullDistance(THRESHOLD * 0.6)
      try {
        await onRefresh()
      } finally {
        setState("idle")
        setPullDistance(0)
      }
    } else {
      setState("idle")
      setPullDistance(0)
    }
    startY.current = 0
  }, [state, pullDistance, onRefresh])

  const progress = Math.min(pullDistance / THRESHOLD, 1)

  return (
    <div
      ref={containerRef}
      className={cn("relative", className)}
      style={{ overscrollBehavior: "contain" }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className="flex items-center justify-center overflow-hidden transition-[height] duration-200 ease-out"
        style={{ height: pullDistance > 0 ? `${pullDistance}px` : 0 }}
      >
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center",
            state === "refreshing" ? "animate-pull-spin" : ""
          )}
          style={{
            opacity: progress,
            transform: `rotate(${progress * 360}deg) scale(${0.5 + progress * 0.5})`,
          }}
        >
          <Loader2 className="w-5 h-5 text-primary" />
        </div>
      </div>

      {children}
    </div>
  )
}
