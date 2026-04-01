"use client"

import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react"
import { usePathname } from "next/navigation"

interface NotificationContextValue {
  unreadCount: number
  refresh: () => void
}

const NotificationContext = createContext<NotificationContextValue>({
  unreadCount: 0,
  refresh: () => {},
})

export function useNotifications() {
  return useContext(NotificationContext)
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0)
  const pathname = usePathname()
  const controllerRef = useRef<AbortController | null>(null)

  const refresh = useCallback(() => {
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    fetch("/api/notifications?unread=true", { signal: controller.signal })
      .then(async (r) => {
        if (!r.ok) {
          await r.text()
          return { count: 0 }
        }
        return r.json()
      })
      .then((d) => setUnreadCount((prev) => (prev === d.count ? prev : d.count)))
      .catch(() => {})
  }, [])

  useEffect(() => {
    refresh()
    return () => controllerRef.current?.abort()
  }, [pathname, refresh])

  const value = useMemo(() => ({ unreadCount, refresh }), [unreadCount, refresh])

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}
