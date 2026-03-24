import { cn } from "@/lib/utils"

interface SkeletonCardProps {
  lines?: number
  className?: string
  showAvatar?: boolean
}

export function SkeletonCard({ lines = 3, className, showAvatar = false }: SkeletonCardProps) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-6 space-y-4", className)}>
      {showAvatar && (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-muted via-muted-foreground/5 to-muted" />
          <div className="space-y-2 flex-1">
            <div className="h-4 w-1/3 rounded bg-muted animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-muted via-muted-foreground/5 to-muted" />
            <div className="h-3 w-1/4 rounded bg-muted animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-muted via-muted-foreground/5 to-muted" />
          </div>
        </div>
      )}
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={i}
          className="h-4 rounded bg-muted animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-muted via-muted-foreground/5 to-muted"
          style={{ width: `${Math.max(40, 100 - i * 20)}%`, animationDelay: `${i * 100}ms` }}
        />
      ))}
    </div>
  )
}
