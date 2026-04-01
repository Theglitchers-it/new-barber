"use client"

import { ThemeProvider } from "next-themes"
import { SessionProvider } from "next-auth/react"
import { Toaster } from "@/components/ui/sonner"
import { LocaleProvider } from "@/lib/i18n/context"
import type { Locale } from "@/lib/i18n"

export function Providers({ children, locale = "it" }: { children: React.ReactNode; locale?: Locale }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <LocaleProvider locale={locale}>
          {children}
          <Toaster />
        </LocaleProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}
