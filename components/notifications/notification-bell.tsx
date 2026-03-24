"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

type Notification = {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  link: string | null
  createdAt: string
}

const typeIcons: Record<string, string> = {
  APPOINTMENT: "📅",
  ORDER: "📦",
  LOYALTY: "⭐",
  SYSTEM: "🔔",
}

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?unread=true")
      if (res.ok) {
        const data = await res.json()
        setUnreadCount((prev) => prev === data.count ? prev : data.count)
      }
    } catch {
      // Silently ignore errors
    }
  }, [])

  const fetchNotifications = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    try {
      const res = await fetch("/api/notifications", { signal: controller.signal })
      if (res.ok) {
        const data = await res.json()
        setNotifications(data)
      }
    } catch {
      // Silently ignore errors
    }
  }, [])

  useEffect(() => {
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => {
      clearInterval(interval)
      abortRef.current?.abort()
    }
  }, [fetchUnreadCount])

  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen])

  const handleOpen = () => {
    const opening = !isOpen
    setIsOpen(opening)
    if (opening) {
      fetchNotifications()
    }
  }

  const markAsRead = async (ids: string[]) => {
    const res = await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    })

    if (res.ok) {
      setNotifications((prev) =>
        prev.map((n) => (ids.includes(n.id) ? { ...n, read: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - ids.length))
    }
  }

  const markAllAsRead = () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id)
    if (unreadIds.length > 0) {
      markAsRead(unreadIds)
    }
  }

  const recentNotifications = notifications.slice(0, 8)

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg hover:bg-muted transition-colors"
        aria-label="Notifiche"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full gradient-primary text-[10px] font-bold text-white animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-96 glass rounded-xl shadow-xl border border-border/50 z-50 animate-slide-up overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border/50">
            <h3 className="font-heading font-semibold text-sm">Notifiche</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-primary hover:text-primary/80"
                onClick={markAllAsRead}
              >
                Segna tutto come letto
              </Button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {recentNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">
                  Nessuna notifica
                </p>
              </div>
            ) : (
              recentNotifications.map((notification) => {
                const content = (
                  <div
                    className={`p-3 border-b border-border/30 hover:bg-muted/50 transition-colors cursor-pointer ${
                      !notification.read ? "bg-primary/5 dark:bg-primary/10" : ""
                    }`}
                    onClick={() => {
                      if (!notification.read) {
                        markAsRead([notification.id])
                      }
                    }}
                  >
                    <div className="flex gap-3">
                      <span className="text-lg shrink-0">
                        {typeIcons[notification.type] || "🔔"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-1">
                          {new Date(notification.createdAt).toLocaleDateString("it-IT", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                )

                const safeLink = notification.link?.startsWith("/") ? notification.link : null

                return safeLink ? (
                  <Link key={notification.id} href={safeLink} onClick={() => setIsOpen(false)}>
                    {content}
                  </Link>
                ) : (
                  <div key={notification.id}>{content}</div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
