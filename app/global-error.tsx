"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"

export default function GlobalError({
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
    <html lang="it">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#f8f8fa", color: "#111" }}>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ maxWidth: "400px", textAlign: "center" }}>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
              Errore critico
            </h1>
            <p style={{ color: "#666", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
              Si è verificato un errore grave. Riprova per ripristinare l&apos;applicazione.
            </p>
            <button
              onClick={reset}
              style={{
                padding: "0.625rem 1.25rem",
                borderRadius: "0.75rem",
                border: "none",
                background: "linear-gradient(135deg, #c83232, #6b21a8, #2563eb)",
                color: "white",
                fontWeight: 600,
                fontSize: "0.875rem",
                cursor: "pointer",
              }}
            >
              Riprova
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
