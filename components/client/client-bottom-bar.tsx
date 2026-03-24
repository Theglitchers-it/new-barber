"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { clientNavItems } from "@/lib/client-nav"

export function ClientBottomBar() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/40" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <ul className="flex items-center justify-around h-16 px-2">
        {clientNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-300 min-w-[56px]",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-300",
                  isActive && "bg-primary/10 scale-110"
                )}>
                  <item.icon className={cn(
                    "w-5 h-5 transition-all duration-300",
                    isActive && "stroke-[2.5]"
                  )} />
                </div>
                <span className={cn(
                  "text-[10px] font-medium transition-all duration-300",
                  isActive && "font-bold"
                )}>
                  {item.label}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
