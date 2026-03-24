"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"
import { navItems } from "@/lib/nav"

// Derive labels from navItems, with fallbacks for sub-pages
const navLabels = Object.fromEntries(
  navItems.map((item) => [item.href.replace("/", ""), item.label])
)
const extraLabels: Record<string, string> = {
  nuova: "Nuova",
  nuovo: "Nuovo",
  carrello: "Carrello",
  "impostazioni-cliente": "Impostazioni",
}
const labels = { ...navLabels, ...extraLabels }

export function Breadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  if (segments.length <= 1) return null

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-muted-foreground mb-3 animate-fade-in">
      <Link
        href="/dashboard"
        className="hover:text-foreground transition-colors flex items-center gap-1"
      >
        <Home className="w-3 h-3" />
      </Link>
      {segments.map((segment, index) => {
        const href = "/" + segments.slice(0, index + 1).join("/")
        const isLast = index === segments.length - 1
        const label = labels[segment] || segment

        return (
          <span key={href} className="flex items-center gap-1">
            <ChevronRight className="w-3 h-3 opacity-40" />
            {isLast ? (
              <span className="font-medium text-foreground" aria-current="page">{label}</span>
            ) : (
              <Link href={href} className="hover:text-foreground transition-colors">
                {label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
