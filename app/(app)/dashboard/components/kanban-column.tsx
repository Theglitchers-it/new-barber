"use client"

import { useDroppable } from "@dnd-kit/core"
import { cn } from "@/lib/utils"
import { KanbanCard, type KanbanAppointment } from "./kanban-card"

interface KanbanColumnProps {
  id: string
  title: string
  color: string
  appointments: KanbanAppointment[]
}

const colorStyles: Record<string, { border: string; bg: string; badge: string }> = {
  amber: {
    border: "border-t-amber-400",
    bg: "bg-amber-50/50 dark:bg-amber-950/10",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  blue: {
    border: "border-t-blue-400",
    bg: "bg-blue-50/50 dark:bg-blue-950/10",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  green: {
    border: "border-t-green-400",
    bg: "bg-green-50/50 dark:bg-green-950/10",
    badge: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  red: {
    border: "border-t-red-400",
    bg: "bg-red-50/50 dark:bg-red-950/10",
    badge: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
}

export function KanbanColumn({ id, title, color, appointments }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })
  const styles = colorStyles[color] || colorStyles.amber

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col rounded-xl border border-border/50 border-t-2 min-w-[220px] flex-1",
        styles.border,
        styles.bg,
        isOver && "ring-2 ring-primary/20 bg-primary/5"
      )}
    >
      <div className="flex items-center justify-between p-3 pb-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
        <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full", styles.badge)}>
          {appointments.length}
        </span>
      </div>
      <div className="flex-1 p-2 pt-0 space-y-1.5 max-h-[300px] overflow-y-auto scrollbar-thin">
        {appointments.length === 0 ? (
          <div className="text-center py-6 text-xs text-muted-foreground/50">
            Nessun appuntamento
          </div>
        ) : (
          appointments.map((apt) => (
            <KanbanCard key={apt.id} appointment={apt} />
          ))
        )}
      </div>
    </div>
  )
}
