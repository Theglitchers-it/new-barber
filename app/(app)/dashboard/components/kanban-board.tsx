"use client"

import { useState, useCallback, useMemo } from "react"
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { KanbanColumn } from "./kanban-column"
import { KanbanCard, type KanbanAppointment } from "./kanban-card"
import { toast } from "sonner"
import { LayoutGrid } from "lucide-react"

interface KanbanBoardProps {
  appointments: KanbanAppointment[]
}

type ColumnId = "waiting" | "in_progress" | "completed" | "no_show"

const columns: { id: ColumnId; title: string; color: string }[] = [
  { id: "waiting", title: "In attesa", color: "amber" },
  { id: "in_progress", title: "In corso", color: "blue" },
  { id: "completed", title: "Completato", color: "green" },
  { id: "no_show", title: "No-show", color: "red" },
]

function getColumnForAppointment(apt: KanbanAppointment): ColumnId {
  if (apt.noShow) return "no_show"
  switch (apt.status) {
    case "PENDING":
    case "CONFIRMED":
      return "waiting"
    case "IN_PROGRESS":
      return "in_progress"
    case "COMPLETED":
      return "completed"
    case "CANCELLED":
      return apt.noShow ? "no_show" : "waiting"
    default:
      return "waiting"
  }
}

function getStatusForColumn(columnId: ColumnId): { status: string; noShow?: boolean } {
  switch (columnId) {
    case "waiting":
      return { status: "PENDING", noShow: false }
    case "in_progress":
      return { status: "IN_PROGRESS", noShow: false }
    case "completed":
      return { status: "COMPLETED", noShow: false }
    case "no_show":
      return { status: "CANCELLED", noShow: true }
  }
}

export function KanbanBoard({ appointments: initialAppointments }: KanbanBoardProps) {
  const [appointments, setAppointments] = useState(initialAppointments)
  const [activeId, setActiveId] = useState<string | null>(null)

  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  })
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 200, tolerance: 5 },
  })
  const sensors = useSensors(pointerSensor, touchSensor)

  const columnData = useMemo(() =>
    columns.map((col) => ({
      ...col,
      appointments: appointments.filter((apt) => getColumnForAppointment(apt) === col.id),
    })),
    [appointments]
  )

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveId(null)
      const { active, over } = event
      if (!over) return

      const appointmentId = active.id as string
      const targetColumn = over.id as ColumnId

      const apt = appointments.find((a) => a.id === appointmentId)
      if (!apt) return

      const currentColumn = getColumnForAppointment(apt)
      if (currentColumn === targetColumn) return

      // Optimistic update
      const { status: newStatus, noShow } = getStatusForColumn(targetColumn)
      const prevAppointments = [...appointments]

      setAppointments((prev) =>
        prev.map((a) =>
          a.id === appointmentId
            ? { ...a, status: newStatus, noShow: noShow ?? false }
            : a
        )
      )

      try {
        const res = await fetch(`/api/appointments/${appointmentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus, ...(noShow !== undefined && { noShow }) }),
        })

        if (!res.ok) {
          throw new Error("Errore aggiornamento")
        }

        const col = columns.find((c) => c.id === targetColumn)
        toast.success(`Spostato in "${col?.title ?? targetColumn}"`)
      } catch {
        // Rollback
        setAppointments(prevAppointments)
        toast.error("Errore durante l'aggiornamento dello stato")
      }
    },
    [appointments]
  )

  const activeAppointment = activeId ? appointments.find((a) => a.id === activeId) : null

  return (
    <Card className="glass animate-slide-up">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-heading flex items-center gap-2">
          <LayoutGrid className="w-4.5 h-4.5" />
          Appuntamenti di Oggi
        </CardTitle>
      </CardHeader>
      <CardContent>
        <DndContext
          sensors={sensors}
          onDragStart={(event) => setActiveId(event.active.id as string)}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveId(null)}
        >
          <div className="flex gap-3 overflow-x-auto pb-2">
            {columnData.map((col) => (
              <KanbanColumn
                key={col.id}
                id={col.id}
                title={col.title}
                color={col.color}
                appointments={col.appointments}
              />
            ))}
          </div>
          <DragOverlay>
            {activeAppointment ? (
              <div className="opacity-90 rotate-2 scale-105">
                <KanbanCard appointment={activeAppointment} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </CardContent>
    </Card>
  )
}
