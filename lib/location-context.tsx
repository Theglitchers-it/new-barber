"use client"

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react"

interface Location {
  id: string
  name: string
  address: string | null
  phone: string | null
  openTime: string
  closeTime: string
  slotDuration: number
}

interface LocationContextValue {
  locationId: string
  locations: Location[]
  setLocationId: (id: string) => void
  currentLocation: Location | undefined
}

const LocationContext = createContext<LocationContextValue>({
  locationId: "",
  locations: [],
  setLocationId: () => {},
  currentLocation: undefined,
})

export function useLocation() {
  return useContext(LocationContext)
}

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [locations, setLocations] = useState<Location[]>([])
  const [locationId, setLocationIdState] = useState("")

  useEffect(() => {
    fetch("/api/locations")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Location[]) => {
        setLocations(data)
        const saved = localStorage.getItem("salonpro-location")
        const valid = data.find((l) => l.id === saved)
        setLocationIdState(valid ? valid.id : data[0]?.id || "")
      })
      .catch(() => {})
  }, [])

  const setLocationId = useCallback((id: string) => {
    setLocationIdState(id)
    localStorage.setItem("salonpro-location", id)
  }, [])

  const currentLocation = useMemo(
    () => locations.find((l) => l.id === locationId),
    [locations, locationId]
  )

  const value = useMemo(
    () => ({ locationId, locations, setLocationId, currentLocation }),
    [locationId, locations, setLocationId, currentLocation]
  )

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  )
}
