import { cn } from "@/lib/utils"

interface StatusDotProps {
  status: "online" | "offline" | "busy" | "away"
  size?: "sm" | "md" | "lg"
  pulse?: boolean
  className?: string
}

const statusColors = {
  online: "bg-emerald-500",
  offline: "bg-gray-400 dark:bg-gray-500",
  busy: "bg-red-500",
  away: "bg-primary",
}

export function StatusDot({ status, size = "md", pulse = true, className }: StatusDotProps) {
  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-2.5 h-2.5",
    lg: "w-3 h-3",
  }

  return (
    <span className={cn("relative inline-flex", className)}>
      <span className={cn("rounded-full", sizeClasses[size], statusColors[status])} />
      {pulse && status === "online" && (
        <span
          className={cn(
            "absolute inset-0 rounded-full animate-ping opacity-75",
            statusColors[status]
          )}
        />
      )}
    </span>
  )
}
