"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"
import { AlertTriangle, RotateCcw, Home } from "lucide-react"
import Link from "next/link"

export default function Error({
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
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-heading font-bold">Qualcosa è andato storto</h1>
          <p className="text-muted-foreground text-sm">
            Si è verificato un errore imprevisto. Riprova o torna alla home.
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
            href="/"
            className="glass px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-muted/50 transition-all"
          >
            <Home className="w-4 h-4" />
            Home
          </Link>
        </div>
      </div>
    </div>
  )
}
