"use client"

import { useDraggable } from "@dnd-kit/core"
import { Clock, GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"

export interface KanbanAppointment {
  id: string
  userName: string
  serviceName: string
  operatorName: string
  startTime: string
  endTime: string
  status: string
  noShow: boolean
}

interface KanbanCardProps {
  appointment: KanbanAppointment
}

export function KanbanCard({ appointment }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: appointment.id,
    data: appointment,
  })

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 50,
      }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      suppressHydrationWarning
      className={cn(
        "flex items-start gap-2 p-2.5 rounded-lg bg-background/80 border border-border/50",
        "hover:border-primary/30 transition-all duration-200 group cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50 shadow-lg scale-105 ring-2 ring-primary/20"
      )}
      {...listeners}
      {...attributes}
    >
      <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{appointment.userName}</p>
        <p className="text-xs text-muted-foreground truncate">{appointment.serviceName}</p>
        <div className="flex items-center gap-1.5 mt-1">
          <Clock className="w-3 h-3 text-muted-foreground/60" />
          <span className="text-[10px] text-muted-foreground">
            {appointment.startTime} - {appointment.endTime}
          </span>
          <span className="text-[10px] text-muted-foreground/60">·</span>
          <span className="text-[10px] text-muted-foreground truncate">{appointment.operatorName}</span>
        </div>
      </div>
    </div>
  )
}
