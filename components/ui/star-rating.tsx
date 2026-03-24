"use client"

import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface StarRatingProps {
  rating: number
  maxRating?: number
  size?: "sm" | "md" | "lg"
  interactive?: boolean
  onChange?: (rating: number) => void
  className?: string
}

export function StarRating({
  rating,
  maxRating = 5,
  size = "md",
  interactive = false,
  onChange,
  className,
}: StarRatingProps) {
  const sizeClasses = {
    sm: "w-3.5 h-3.5",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  }

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {Array.from({ length: maxRating }, (_, i) => {
        const filled = i < Math.floor(rating)
        const halfFilled = !filled && i < rating
        const starEl = (
          <Star
            className={cn(
              sizeClasses[size],
              "transition-colors",
              filled
                ? "fill-primary text-primary"
                : halfFilled
                  ? "fill-primary/50 text-primary"
                  : "fill-transparent text-muted-foreground/30"
            )}
          />
        )
        if (interactive) {
          return (
            <button
              key={i}
              type="button"
              onClick={() => onChange?.(i + 1)}
              className="transition-all duration-200 cursor-pointer hover:scale-125 active:scale-95"
            >
              {starEl}
            </button>
          )
        }
        return <span key={i} className="transition-all duration-200">{starEl}</span>
      })}
    </div>
  )
}
