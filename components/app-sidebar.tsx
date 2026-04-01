"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { navItems, filterNavItems } from "@/lib/nav"
import { useTheme } from "next-themes"
import { Scissors, LogOut, Sun, Moon, Search, Bell } from "lucide-react"
import { USER_ROLE } from "@/lib/constants"
import { useNotifications } from "@/components/client/notification-provider"
import { useTranslation } from "@/lib/i18n/context"

export function AppSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { resolvedTheme, setTheme } = useTheme()
  const { t } = useTranslation()
  const isAdmin = session?.user?.role === USER_ROLE.ADMIN
  const profileHref = isAdmin ? "/impostazioni" : "/profilo"

  const filteredItems = filterNavItems(navItems, isAdmin)
  const { unreadCount } = useNotifications()

  return (
    <aside className="hidden md:flex w-64 flex-col glass-gradient border-r-0 h-screen sticky top-0">
      {/* Logo */}
      <div className="p-5 border-b border-border/30">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/25 animate-bounce-in">
              <Scissors className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-heading text-lg font-bold tracking-tight gradient-text">SalonPro</h1>
              <p className="text-xs text-muted-foreground">Il tuo salone</p>
            </div>
          </Link>
          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="ml-auto relative w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-accent/10 hover:text-foreground transition-all duration-300"
            title="Cambia tema"
          >
            <Sun className="w-4 h-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute w-4 h-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </button>
        </div>
      </div>

      {/* Search + Notifications */}
      <div className="px-3 pt-3 space-y-1">
        <button
          aria-label="Apri ricerca"
          onClick={() => {
            const e = new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true })
            window.dispatchEvent(e)
          }}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs text-muted-foreground/70 bg-accent/5 hover:bg-accent/10 transition-all duration-200 border border-border/15"
        >
          <Search className="w-3.5 h-3.5 shrink-0" />
          <span className="flex-1 text-left truncate">Cerca...</span>
          <kbd className="shrink-0 h-4 flex items-center rounded border border-border/20 bg-muted/20 px-1 text-[9px] font-mono text-muted-foreground/40">⌘K</kbd>
        </button>
        <Link
          href="/notifiche"
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-muted-foreground hover:bg-accent/10 hover:text-foreground transition-all duration-200"
        >
          <Bell className="w-3.5 h-3.5 shrink-0" />
          <span className="flex-1 truncate">Notifiche</span>
          {unreadCount > 0 && (
            <span className="w-4 h-4 rounded-full gradient-primary text-[9px] font-bold text-white flex items-center justify-center animate-bounce-in shrink-0">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 overflow-y-auto">
        <ul className="space-y-1">
          {filteredItems.map((item, index) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <li key={item.href} className="animate-slide-in-left" style={{ animationDelay: `${index * 50}ms` }}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300",
                    isActive
                      ? "gradient-primary text-white shadow-lg shadow-primary/25"
                      : "text-muted-foreground hover:bg-accent/10 hover:text-foreground hover:translate-x-1"
                  )}
                >
                  <item.icon className={cn(
                    "w-4 h-4 transition-transform duration-300",
                    !isActive && "group-hover:scale-110"
                  )} />
                  {t(item.label as never)}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User area */}
      <div className="p-3 mb-2 border-t border-border/30">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl">
          <Link
            href={profileHref}
            className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity"
          >
            <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-white shadow-md shadow-primary/20 shrink-0">
              {session?.user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{session?.user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
            </div>
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-300 shrink-0"
            title="Esci"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
