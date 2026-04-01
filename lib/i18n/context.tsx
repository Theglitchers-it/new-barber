"use client"

import { createContext, useContext, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { getTranslation, type Locale, type TranslateFn } from "./index"

interface LocaleContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: TranslateFn
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: "it",
  setLocale: () => {},
  t: (key) => key,
})

export function useTranslation() {
  return useContext(LocaleContext)
}

export function LocaleProvider({
  locale: initialLocale,
  children,
}: {
  locale: Locale
  children: React.ReactNode
}) {
  const router = useRouter()

  const setLocale = useCallback(
    (newLocale: Locale) => {
      const secure = window.location.protocol === "https:" ? ";Secure" : ""
      document.cookie = `locale=${newLocale};path=/;max-age=31536000;SameSite=Lax${secure}`
      router.refresh()
    },
    [router]
  )

  const t = useMemo(() => getTranslation(initialLocale), [initialLocale])

  const value = useMemo(
    () => ({ locale: initialLocale, setLocale, t }),
    [initialLocale, setLocale, t]
  )

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  )
}
