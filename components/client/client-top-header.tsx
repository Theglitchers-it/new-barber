"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Bell, Sun, Moon } from "lucide-react"

export function ClientTopHeader() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { resolvedTheme, setTheme } = useTheme()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    fetch("/api/notifications?unread=true", { signal: controller.signal })
      .then((r) => r.ok ? r.json() : { count: 0 })
      .then((d) => setUnreadCount(d.count || 0))
      .catch(() => {})
    return () => controller.abort()
  }, [pathname])

  const userName = session?.user?.name || "Cliente"
  const initial = userName[0]?.toUpperCase() || "C"

  return (
    <header className="md:hidden sticky top-0 z-50 glass border-b border-border/30 px-4 py-3 flex items-center justify-between">
      <Link href="/profilo" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
        <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-sm font-bold text-white shadow-md shadow-primary/20">
          {initial}
        </div>
        <span className="text-sm font-semibold text-foreground">
          Ciao, {userName.split(" ")[0]}
        </span>
      </Link>

      <div className="flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-xl w-9 h-9"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        >
          {resolvedTheme === "dark" ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
        </Button>
        <Link href="/notifiche" className="relative">
          <Button variant="ghost" size="icon" className="rounded-xl w-9 h-9">
            <Bell className="w-4.5 h-4.5" />
          </Button>
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full gradient-primary text-[10px] font-bold text-white flex items-center justify-center animate-bounce-in">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  )
}
