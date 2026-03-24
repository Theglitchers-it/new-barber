"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function Marquee({
  children,
  speed = 30,
  className,
}: {
  children: ReactNode
  speed?: number
  className?: string
}) {
  const trackStyle = { animationDuration: `${speed}s` }

  return (
    <div className={cn("marquee", className)}>
      <div className="marquee-track" style={trackStyle}>
        {children}
      </div>
      <div className="marquee-track" aria-hidden style={trackStyle}>
        {children}
      </div>
    </div>
  )
}
