"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { navItems, filterNavItems } from "@/lib/nav"
import { useTheme } from "next-themes"
import { Scissors, LogOut, Menu, Bell, Sun, Moon } from "lucide-react"
import { useNotifications } from "@/components/client/notification-provider"
import { LocationSelector } from "@/components/location-selector"

export function AppHeader() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { resolvedTheme, setTheme } = useTheme()
  const isAdmin = session?.user?.role === "ADMIN"
  const profileHref = isAdmin ? "/impostazioni" : "/profilo"
  const [open, setOpen] = useState(false)
  const { unreadCount } = useNotifications()

  const filteredItems = filterNavItems(navItems, isAdmin)

  return (
    <header className="md:hidden glass-gradient border-b-0 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
      <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center shrink-0">
          <Scissors className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="font-heading font-bold gradient-text">SalonPro</span>
      </Link>

      <div className="flex items-center gap-1.5">
        <LocationSelector />
        <button
          className="relative w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-accent/10 hover:text-foreground transition-all duration-300"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        >
          <Sun className="w-5 h-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute w-5 h-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </button>
        <Link href="/notifiche" className="relative">
          <Button variant="ghost" size="icon" className="rounded-xl">
            <Bell className="w-5 h-5" />
          </Button>
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full gradient-primary text-[10px] font-bold text-white flex items-center justify-center animate-bounce-in">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-xl">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" showCloseButton={false} className="w-64 sm:w-72 p-0 glass-gradient">
            <SheetTitle className="sr-only">Menu di navigazione</SheetTitle>
            <div className="p-5 border-b border-border/30">
              <div className="flex items-center gap-3">
                <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-3 hover:opacity-80 transition-opacity flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/25 shrink-0">
                    <Scissors className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h1 className="font-heading text-lg font-bold tracking-tight gradient-text">SalonPro</h1>
                    <p className="text-xs text-muted-foreground">Il tuo salone</p>
                  </div>
                </Link>
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-accent/10 hover:text-foreground transition-all shrink-0"
                  aria-label="Chiudi menu"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </div>
            </div>
            <nav className="p-3">
              <ul className="space-y-1">
                {filteredItems.map((item, index) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                  return (
                    <li key={item.href} className="animate-slide-in-left" style={{ animationDelay: `${index * 40}ms` }}>
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300",
                          isActive
                            ? "gradient-primary text-white shadow-lg shadow-primary/25"
                            : "text-muted-foreground hover:bg-accent/10 hover:text-foreground"
                        )}
                      >
                        <item.icon className="w-4 h-4" />
                        {item.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>
            <div className="p-3 mb-2 border-t border-border/30 mt-auto absolute bottom-0 left-0 right-0">
              <div className="flex items-center gap-3 px-3 py-2 rounded-xl">
                <Link
                  href={profileHref}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity"
                >
                  <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-white shrink-0">
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
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
