import { Search, Home, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
          <Search className="w-8 h-8 text-primary" />
        </div>

        <div className="space-y-2">
          <h1 className="text-6xl font-heading font-extrabold gradient-text">404</h1>
          <p className="text-lg font-medium">Pagina non trovata</p>
          <p className="text-muted-foreground text-sm">
            La pagina che cerchi non esiste o è stata spostata.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="btn-gradient px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            Torna alla Home
          </Link>
          <Link
            href="/dashboard"
            className="glass px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-muted/50 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
