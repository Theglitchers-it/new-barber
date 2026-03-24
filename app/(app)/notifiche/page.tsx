"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bell, Calendar, Package, Gift, Info, CheckCheck } from "lucide-react"
import { cn } from "@/lib/utils"

interface Notification {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  link: string | null
  createdAt: string
}

const typeIcons: Record<string, typeof Bell> = {
  APPOINTMENT: Calendar,
  ORDER: Package,
  LOYALTY: Gift,
  SYSTEM: Info,
}

export default function NotifichePage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setNotifications(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id)
    if (unreadIds.length === 0) return

    const res = await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: unreadIds }),
    })
    if (res.ok) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    }
  }

  const markAsRead = async (id: string) => {
    const res = await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    })
    if (res.ok) {
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-heading font-extrabold">Notifiche</h1>
          {unreadCount > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">{unreadCount} non lette</p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs gap-1.5">
            <CheckCheck className="w-3.5 h-3.5" /> Segna tutte come lette
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card className="glass">
          <CardContent className="p-8 text-center">
            <Bell className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nessuna notifica</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-1.5">
          {notifications.map((n) => {
            const Icon = typeIcons[n.type] || Bell
            return (
              <button
                key={n.id}
                onClick={() => !n.read && markAsRead(n.id)}
                className={cn(
                  "w-full text-left flex items-start gap-3 p-3 rounded-xl transition-colors",
                  n.read ? "bg-muted/20" : "bg-primary/5 hover:bg-primary/10"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                  n.read ? "bg-muted/50" : "bg-primary/15"
                )}>
                  <Icon className={cn("w-4 h-4", n.read ? "text-muted-foreground" : "text-primary")} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className={cn("text-sm truncate", !n.read && "font-semibold")}>{n.title}</p>
                    {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {new Date(n.createdAt).toLocaleString("it-IT", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
