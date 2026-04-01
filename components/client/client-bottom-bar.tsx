"use client"

import { useMemo } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { clientNavItems } from "@/lib/client-nav"
import { useTranslation } from "@/lib/i18n/context"

export function ClientBottomBar() {
  const pathname = usePathname()
  const { t } = useTranslation()

  const activeIndex = useMemo(() => {
    const idx = clientNavItems.findIndex(
      (item) => pathname === item.href || pathname.startsWith(item.href + "/")
    )
    return idx >= 0 ? idx : 0
  }, [pathname])

  const pillOffset = `${activeIndex * (100 / clientNavItems.length)}%`
  const pillWidth = `${100 / clientNavItems.length}%`

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bottom-bar-float bg-background/75 border-t border-border/30"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {/* Sliding pill indicator */}
      <div className="absolute top-0 left-0 right-0 h-0.5">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
          style={{ width: pillWidth, marginLeft: pillOffset }}
        />
      </div>

      <ul className="flex items-center justify-around h-16 px-1">
        {clientNavItems.map((item, i) => {
          const isActive = i === activeIndex
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "press-feedback flex flex-col items-center gap-0.5 py-1.5 rounded-xl transition-all duration-300 touch-target justify-center",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div
                  className={cn(
                    "flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-300",
                    isActive && "bg-primary/10 scale-110 animate-tap-bounce"
                  )}
                >
                  <item.icon
                    className={cn(
                      "w-5 h-5 transition-all duration-300",
                      isActive && "stroke-[2.5]"
                    )}
                  />
                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium transition-all duration-300",
                    isActive && "font-bold"
                  )}
                >
                  {t(item.label as never)}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
