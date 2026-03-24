"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useTransition } from "react"
import { Search, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ClientiSearch({
  defaultQuery,
  currentSort,
  currentOrder,
}: {
  defaultQuery: string
  currentSort: string
  currentOrder: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(defaultQuery)
  const [isPending, startTransition] = useTransition()

  function updateParams(params: Record<string, string>) {
    const sp = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(params)) {
      if (v) sp.set(k, v)
      else sp.delete(k)
    }
    startTransition(() => router.push(`/clienti?${sp.toString()}`))
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    updateParams({ q: query })
  }

  function toggleSort(field: string) {
    const newOrder = currentSort === field && currentOrder === "desc" ? "asc" : "desc"
    updateParams({ sort: field, order: newOrder })
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <form onSubmit={handleSearch} className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          aria-label="Cerca clienti"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cerca per nome, email o telefono..."
          className="w-full pl-9 pr-4 py-2 rounded-xl bg-accent/5 border border-border/20 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
        />
      </form>
      <div className="flex gap-1.5">
        {[
          { field: "createdAt", label: "Data" },
          { field: "name", label: "Nome" },
          { field: "loyaltyPoints", label: "Punti" },
        ].map((s) => (
          <Button
            key={s.field}
            variant={currentSort === s.field ? "default" : "outline"}
            size="sm"
            className="text-xs h-9 gap-1"
            onClick={() => toggleSort(s.field)}
            disabled={isPending}
          >
            <ArrowUpDown className="w-3 h-3" />
            {s.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
