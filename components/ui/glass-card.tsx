import { cn } from "@/lib/utils"
import { forwardRef } from "react"

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "subtle"
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-xl p-6 animate-scale-in",
        variant === "default" ? "glass" : "glass-subtle",
        className
      )}
      {...props}
    />
  )
)
GlassCard.displayName = "GlassCard"

export { GlassCard }
