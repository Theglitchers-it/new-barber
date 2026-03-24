"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { clientNavItems } from "@/lib/client-nav"
import { Scissors, LogOut, Sun, Moon, Bell } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function ClientSlimSidebar() {
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

  const initial = session?.user?.name?.[0]?.toUpperCase() || "C"

  return (
    <TooltipProvider delayDuration={200}>
      <aside className="hidden md:flex w-[72px] flex-col items-center glass-gradient border-r-0 h-screen sticky top-0 py-4 gap-2">
        {/* Logo */}
        <Link href="/" className="mb-4 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/25">
            <Scissors className="w-5 h-5 text-white" />
          </div>
        </Link>

        {/* Nav */}
        <nav className="flex-1 flex flex-col items-center gap-1">
          {clientNavItems.filter((item) => item.href !== "/profilo").map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-300",
                      isActive
                        ? "gradient-primary text-white shadow-lg shadow-primary/25"
                        : "text-muted-foreground hover:bg-accent/30 hover:text-foreground"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {item.label}
                </TooltipContent>
              </Tooltip>
            )
          })}
        </nav>

        {/* Bottom area */}
        <div className="flex flex-col items-center gap-2 pt-2 border-t border-border/30">
          {/* Notifiche */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/notifiche"
                className={cn(
                  "relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300",
                  pathname === "/notifiche"
                    ? "gradient-primary text-white shadow-lg shadow-primary/25"
                    : "text-muted-foreground hover:bg-accent/30 hover:text-foreground"
                )}
              >
                <Bell className="w-4.5 h-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full gradient-primary text-[9px] font-bold text-white flex items-center justify-center animate-bounce-in">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              Notifiche{unreadCount > 0 ? ` (${unreadCount})` : ""}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                className="flex items-center justify-center w-10 h-10 rounded-xl text-muted-foreground hover:bg-accent/30 hover:text-foreground transition-all duration-300"
              >
                {resolvedTheme === "dark" ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              {resolvedTheme === "dark" ? "Modalità chiara" : "Modalità scura"}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/profilo"
                className="flex items-center justify-center w-10 h-10 rounded-full gradient-primary text-xs font-bold text-white shadow-md shadow-primary/20 hover:opacity-80 transition-opacity"
              >
                {initial}
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              {session?.user?.name || "Profilo"}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center justify-center w-10 h-10 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-300"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              Esci
            </TooltipContent>
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  )
}
