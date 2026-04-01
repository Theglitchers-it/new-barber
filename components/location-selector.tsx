"use client"

import { useLocation } from "@/lib/location-context"
import { MapPin } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function LocationSelector() {
  const { locationId, locations, setLocationId } = useLocation()

  if (locations.length <= 1) return null

  return (
    <Select value={locationId} onValueChange={setLocationId}>
      <SelectTrigger className="w-auto gap-2 border-0 bg-transparent hover:bg-accent/10 transition-colors h-9 px-3 text-sm">
        <MapPin className="w-4 h-4 text-primary shrink-0" />
        <SelectValue placeholder="Seleziona sede" />
      </SelectTrigger>
      <SelectContent>
        {locations.map((loc) => (
          <SelectItem key={loc.id} value={loc.id}>
            {loc.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
