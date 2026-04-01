"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Bell, Sun, Moon, LogOut } from "lucide-react"
import { useNotifications } from "@/components/client/notification-provider"

export function ClientTopHeader() {
  const { data: session } = useSession()
  const { resolvedTheme, setTheme } = useTheme()
  const { unreadCount } = useNotifications()

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

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Cambia tema"
          className="rounded-xl w-9 h-9 relative"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        >
          <Sun className="w-4.5 h-4.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute w-4.5 h-4.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
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
        <Button
          variant="ghost"
          size="icon"
          className="rounded-xl w-9 h-9 text-muted-foreground"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </header>
  )
}
