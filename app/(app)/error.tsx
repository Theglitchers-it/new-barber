"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"
import { AlertTriangle, RotateCcw, LayoutDashboard } from "lucide-react"
import Link from "next/link"

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="w-7 h-7 text-destructive" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-heading font-bold">Errore nel caricamento</h2>
          <p className="text-muted-foreground text-sm">
            Non è stato possibile caricare questa sezione. Riprova o torna alla dashboard.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="btn-gradient px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Riprova
          </button>
          <Link
            href="/dashboard"
            className="glass px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-muted/50 transition-all"
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
