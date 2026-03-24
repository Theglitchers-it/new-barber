"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Calendar, Bell, Scissors, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface Reminder {
  id: string
  title: string
  suggestedDate: string
  intervalDays: number
  active: boolean
  service: { name: string; duration: number } | null
}

interface CalendarAppointment {
  id: string
  date: string
  startTime: string
  service: { name: string }
  operator: { name: string }
}

interface Props {
  reminders: Reminder[]
  appointments: CalendarAppointment[]
}

const MONTHS_IT = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"]
const DAYS_IT = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"]

export function BeautyCalendar({ reminders, appointments }: Props) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return { month: now.getMonth(), year: now.getFullYear() }
  })

  const daysInMonth = useMemo(() => {
    const { month, year } = currentMonth
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startOffset = (firstDay.getDay() + 6) % 7 // Monday = 0
    const days: Array<{ date: Date; isCurrentMonth: boolean }> = []

    // Previous month padding
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(year, month, -i)
      days.push({ date: d, isCurrentMonth: false })
    }
    // Current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true })
    }
    // Next month padding
    const remaining = 7 - (days.length % 7)
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false })
      }
    }
    return days
  }, [currentMonth])

  const reminderDates = useMemo(() => {
    const map = new Map<string, Reminder[]>()
    for (const r of reminders) {
      const key = new Date(r.suggestedDate).toDateString()
      const arr = map.get(key) || []
      arr.push(r)
      map.set(key, arr)
    }
    return map
  }, [reminders])

  const appointmentDates = useMemo(() => {
    const map = new Map<string, CalendarAppointment[]>()
    for (const a of appointments) {
      const key = new Date(a.date).toDateString()
      const arr = map.get(key) || []
      arr.push(a)
      map.set(key, arr)
    }
    return map
  }, [appointments])

  const now = useMemo(() => Date.now(), [])
  const today = useMemo(() => new Date(now).toDateString(), [now])

  const changeMonth = (delta: number) => setCurrentMonth((prev) => {
    const m = prev.month + delta
    if (m < 0) return { month: 11, year: prev.year - 1 }
    if (m > 11) return { month: 0, year: prev.year + 1 }
    return { month: m, year: prev.year }
  })

  const upcomingReminders = useMemo(
    () => reminders.filter((r) => new Date(r.suggestedDate).getTime() >= now).slice(0, 5),
    [reminders, now]
  )

  return (
    <div className="space-y-4">
      {/* Calendar Grid */}
      <Card className="glass border-0">
        <CardContent className="p-4">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon" onClick={() => changeMonth(-1)} className="rounded-xl">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h3 className="font-heading font-bold">
              {MONTHS_IT[currentMonth.month]} {currentMonth.year}
            </h3>
            <Button variant="ghost" size="icon" onClick={() => changeMonth(1)} className="rounded-xl">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAYS_IT.map((d) => (
              <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-1">
            {daysInMonth.map(({ date, isCurrentMonth }, i) => {
              const key = date.toDateString()
              const isToday = key === today
              const hasReminder = reminderDates.has(key)
              const hasAppointment = appointmentDates.has(key)

              return (
                <div
                  key={i}
                  className={cn(
                    "relative aspect-square flex flex-col items-center justify-center rounded-lg text-xs transition-colors",
                    !isCurrentMonth && "opacity-30",
                    isToday && "bg-primary/10 font-bold text-primary",
                    !isToday && isCurrentMonth && "hover:bg-accent/10"
                  )}
                >
                  <span>{date.getDate()}</span>
                  {(hasReminder || hasAppointment) && (
                    <div className="flex gap-0.5 mt-0.5">
                      {hasAppointment && <div className="w-1 h-1 rounded-full bg-primary" />}
                      {hasReminder && <div className="w-1 h-1 rounded-full bg-amber-500" />}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/30">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-primary" /> Appuntamenti
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-amber-500" /> Reminder
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Reminders */}
      {upcomingReminders.length > 0 && (
        <div>
          <h3 className="text-sm font-heading font-bold mb-2 flex items-center gap-1.5">
            <Bell className="w-4 h-4 text-amber-500" />
            Prossimi Appuntamenti Consigliati
          </h3>
          <div className="space-y-2">
            {upcomingReminders.map((r) => {
              const date = new Date(r.suggestedDate)
              const daysUntil = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

              return (
                <Card key={r.id} className="glass border-0 hover-lift">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                      daysUntil <= 3 ? "bg-red-500/10" : daysUntil <= 7 ? "bg-amber-500/10" : "bg-primary/10"
                    )}>
                      <Scissors className={cn(
                        "w-4 h-4",
                        daysUntil <= 3 ? "text-red-500" : daysUntil <= 7 ? "text-amber-500" : "text-primary"
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{r.title}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {date.toLocaleDateString("it-IT", { day: "numeric", month: "long" })}
                        {daysUntil <= 0 ? " · Oggi!" : ` · tra ${daysUntil} giorni`}
                      </p>
                    </div>
                    <Link href="/prenotazioni/nuova">
                      <Button size="sm" variant="outline" className="text-xs h-7 shrink-0">
                        Prenota
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {reminders.length === 0 && appointments.length === 0 && (
        <div className="text-center py-8">
          <Calendar className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
          <p className="font-heading font-bold">Il tuo calendario è vuoto</p>
          <p className="text-sm text-muted-foreground mt-1">
            I reminder verranno creati automaticamente in base alle tue visite
          </p>
        </div>
      )}
    </div>
  )
}
