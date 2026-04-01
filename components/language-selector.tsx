"use client"

import { useTranslation } from "@/lib/i18n/context"
import { cn } from "@/lib/utils"

export function LanguageSelector({ className }: { className?: string }) {
  const { locale, setLocale } = useTranslation()

  return (
    <div className={cn("flex items-center gap-0.5 rounded-lg bg-muted/50 p-0.5", className)}>
      <button
        onClick={() => setLocale("it")}
        className={cn(
          "px-2 py-1 text-xs font-semibold rounded-md transition-all duration-200",
          locale === "it"
            ? "bg-primary text-white shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        IT
      </button>
      <button
        onClick={() => setLocale("en")}
        className={cn(
          "px-2 py-1 text-xs font-semibold rounded-md transition-all duration-200",
          locale === "en"
            ? "bg-primary text-white shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        EN
      </button>
    </div>
  )
}
