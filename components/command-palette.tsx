"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { navItems, filterNavItems } from "@/lib/nav"
import { USER_ROLE } from "@/lib/constants"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const router = useRouter()
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === USER_ROLE.ADMIN

  const items = useMemo(() => filterNavItems(navItems, isAdmin), [isAdmin])

  const filtered = useMemo(
    () =>
      query
        ? items.filter((item) =>
            item.label.toLowerCase().includes(query.toLowerCase())
          )
        : items,
    [query, items]
  )

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const handleSelect = useCallback(
    (href: string) => {
      setOpen(false)
      setQuery("")
      router.push(href)
    },
    [router]
  )

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === "Enter" && filtered[selectedIndex]) {
        e.preventDefault()
        handleSelect(filtered[selectedIndex].href)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open, filtered, selectedIndex, handleSelect])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[420px] p-0 gap-0 glass border-border/40 overflow-hidden rounded-2xl shadow-2xl">
        <DialogTitle className="sr-only">Ricerca rapida</DialogTitle>

        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border/30">
          <Search className="w-4 h-4 text-muted-foreground/60 shrink-0" />
          <input
            autoFocus
            aria-label="Cerca pagina"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Dove vuoi andare?"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50 min-w-0"
          />
          <kbd className="hidden sm:flex h-5 items-center rounded-md border border-border/30 bg-muted/30 px-1.5 text-[10px] font-mono text-muted-foreground/50 shrink-0">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div role="listbox" aria-label="Risultati ricerca" className="max-h-[280px] overflow-y-auto py-1.5">
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8">
              <Search className="w-6 h-6 text-muted-foreground/20 mb-2" />
              <p className="text-xs text-muted-foreground/60">Nessun risultato</p>
            </div>
          )}
          {filtered.map((item, index) => {
            const isSelected = index === selectedIndex
            return (
              <button
                key={item.href}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(item.href)}
                className={cn(
                  "flex items-center gap-3 w-full mx-1.5 px-3 py-2.5 text-sm transition-all duration-150 text-left rounded-xl",
                  "w-[calc(100%-12px)]",
                  isSelected
                    ? "bg-primary/10 text-foreground"
                    : "text-muted-foreground hover:bg-accent/5 hover:text-foreground"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                  isSelected ? "bg-primary/15" : "bg-accent/10"
                )}>
                  <item.icon className="w-4 h-4" />
                </div>
                <span className="flex-1 font-medium truncate">{item.label}</span>
                {isSelected && (
                  <span className="text-[10px] text-muted-foreground/50 shrink-0">↵</span>
                )}
              </button>
            )
          })}
        </div>

        {/* Footer hint */}
        <div className="flex items-center justify-center gap-3 px-4 py-2 border-t border-border/20 text-[10px] text-muted-foreground/40">
          <span className="flex items-center gap-1"><kbd className="px-1 rounded border border-border/20 bg-muted/20">↑↓</kbd> naviga</span>
          <span className="flex items-center gap-1"><kbd className="px-1 rounded border border-border/20 bg-muted/20">↵</kbd> apri</span>
          <span className="flex items-center gap-1"><kbd className="px-1 rounded border border-border/20 bg-muted/20">esc</kbd> chiudi</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
