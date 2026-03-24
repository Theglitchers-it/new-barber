"use client"

import { useEffect } from "react"
import { Check } from "lucide-react"

const COLORS = [
  "oklch(0.55 0.24 25)",   // primary red
  "oklch(0.42 0.18 260)",  // secondary blue
  "oklch(0.65 0.2 155)",   // success green
  "oklch(0.78 0.18 75)",   // gold
  "oklch(0.65 0.22 25)",   // light primary
  "oklch(0.82 0.01 250)",  // accent silver
]

interface CelebrationProps {
  onComplete?: () => void
  duration?: number
}

// Deterministic pseudo-random for SSR safety
function seeded(i: number) {
  const x = Math.sin(i * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

export function Celebration({ onComplete, duration = 2000 }: CelebrationProps) {
  useEffect(() => {
    if (!onComplete) return
    const timer = setTimeout(onComplete, duration)
    return () => clearTimeout(timer)
  }, [onComplete, duration])

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Confetti pieces */}
      {Array.from({ length: 30 }, (_, i) => (
        <div
          key={i}
          className="absolute animate-confetti-fall"
          style={{
            left: `${5 + seeded(i) * 90}%`,
            width: `${4 + seeded(i + 30) * 4}px`,
            height: `${4 + seeded(i + 60) * 4}px`,
            backgroundColor: COLORS[i % COLORS.length],
            borderRadius: seeded(i + 90) > 0.5 ? "50%" : "2px",
            animationDelay: `${seeded(i + 120) * 0.6}s`,
            animationDuration: `${1.2 + seeded(i + 150) * 0.8}s`,
          }}
        />
      ))}

      {/* Center checkmark */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center animate-bounce-in shadow-2xl shadow-primary/30">
          <Check className="w-10 h-10 text-white" strokeWidth={3} />
        </div>
      </div>
    </div>
  )
}
