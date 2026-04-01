import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

const bone = "rounded-xl bg-muted/40"

/** Dashboard skeleton — KPI cards + kanban + chart */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-4 md:p-0">
      {/* Title */}
      <div className="space-y-2">
        <Skeleton className={cn(bone, "h-8 w-48")} />
        <Skeleton className={cn(bone, "h-4 w-32")} />
      </div>
      {/* Period tabs */}
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className={cn(bone, "h-9 w-20 rounded-full")} />
        ))}
      </div>
      {/* Quick actions */}
      <div className="flex gap-3 overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className={cn(bone, "h-10 w-40 shrink-0")} />
        ))}
      </div>
      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className={cn(bone, "h-28")} />
        ))}
      </div>
      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        <Skeleton className={cn(bone, "h-64")} />
        <Skeleton className={cn(bone, "h-64")} />
      </div>
    </div>
  )
}

/** List skeleton — title + filter + items */
export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-4 p-4 md:p-0">
      <div className="flex items-center justify-between">
        <Skeleton className={cn(bone, "h-8 w-40")} />
        <Skeleton className={cn(bone, "h-10 w-36")} />
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className={cn(bone, "h-8 w-24 rounded-full")} />
        ))}
      </div>
      <Skeleton className={cn(bone, "h-10 w-full")} />
      <div className="space-y-3">
        {Array.from({ length: items }).map((_, i) => (
          <Skeleton key={i} className={cn(bone, "h-24")} />
        ))}
      </div>
    </div>
  )
}

/** Grid skeleton — title + grid of cards */
export function GridSkeleton({ cols = 2, items = 6 }: { cols?: number; items?: number }) {
  return (
    <div className="space-y-4 p-4 md:p-0">
      <div className="flex items-center justify-between">
        <Skeleton className={cn(bone, "h-8 w-40")} />
        <Skeleton className={cn(bone, "h-10 w-28")} />
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className={cn(bone, "h-8 w-20 rounded-full")} />
        ))}
      </div>
      <div className={cn("grid gap-3", cols === 2 ? "grid-cols-2" : "grid-cols-1 md:grid-cols-3")}>
        {Array.from({ length: items }).map((_, i) => (
          <Skeleton key={i} className={cn(bone, "h-64")} />
        ))}
      </div>
    </div>
  )
}

/** Feed skeleton — vertical post cards */
export function FeedSkeleton() {
  return (
    <div className="space-y-4 p-4 md:p-0 max-w-lg mx-auto">
      <Skeleton className={cn(bone, "h-8 w-32")} />
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className={cn(bone, "h-8 w-16 rounded-full")} />
        ))}
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className={cn(bone, "w-10 h-10 rounded-full")} />
            <div className="space-y-1">
              <Skeleton className={cn(bone, "h-4 w-28")} />
              <Skeleton className={cn(bone, "h-3 w-20")} />
            </div>
          </div>
          <Skeleton className={cn(bone, "h-80 w-full")} />
          <div className="flex gap-4">
            <Skeleton className={cn(bone, "h-5 w-12")} />
            <Skeleton className={cn(bone, "h-5 w-12")} />
            <Skeleton className={cn(bone, "h-5 w-12")} />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Simple card skeleton */
export function CardSkeleton() {
  return (
    <div className="space-y-4 p-4 md:p-0">
      <Skeleton className={cn(bone, "h-8 w-40")} />
      <Skeleton className={cn(bone, "h-48")} />
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className={cn(bone, "h-20")} />
        <Skeleton className={cn(bone, "h-20")} />
        <Skeleton className={cn(bone, "h-20")} />
      </div>
      <Skeleton className={cn(bone, "h-32")} />
    </div>
  )
}
