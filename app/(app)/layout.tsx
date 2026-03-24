import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { ClientSlimSidebar } from "@/components/client/client-slim-sidebar"
import { ClientTopHeader } from "@/components/client/client-top-header"
import { ClientBottomBar } from "@/components/client/client-bottom-bar"
import { CommandPalette } from "@/components/command-palette"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { auth } from "@/lib/auth"
import Link from "next/link"
import { Scissors } from "lucide-react"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  const isLoggedIn = !!session?.user

  // Public layout for unauthenticated users (e.g. /shop)
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex flex-col">
        <nav className="sticky top-0 z-50 glass border-b border-border/30">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <Scissors className="w-4 h-4 text-white" />
              </div>
              <span className="font-heading text-lg font-extrabold gradient-text">
                SalonPro
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
              >
                Home
              </Link>
              <Link
                href="/shop"
                className="text-sm font-medium text-foreground"
              >
                Shop
              </Link>
              <Link
                href="/login"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
              >
                Accedi
              </Link>
              <Link
                href="/registrati"
                className="btn-gradient px-3 sm:px-4 py-2 rounded-xl font-bold text-sm"
              >
                Registrati
              </Link>
            </div>
          </div>
        </nav>
        <main className="flex-1 p-4 md:p-6 w-full max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    )
  }

  const isClient = session.user.role === "CLIENT"

  // Client layout: slim sidebar (desktop) + top header + bottom bar (mobile)
  if (isClient) {
    return (
      <div data-role="client" className="flex min-h-screen flex-col md:flex-row">
        <ClientSlimSidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          <ClientTopHeader />
          <main className="flex-1 p-4 md:p-6 w-full max-w-4xl mx-auto pb-20 md:pb-6">
            {children}
          </main>
          <ClientBottomBar />
        </div>
      </div>
    )
  }

  // Admin layout: full sidebar + header + command palette
  return (
    <div data-role="admin" className="flex min-h-screen">
      <AppSidebar />
      <div className="flex-1 flex flex-col">
        <AppHeader />
        <main className="flex-1 p-4 md:p-6 w-full max-w-7xl mx-auto">
          <Breadcrumbs />
          {children}
        </main>
      </div>
      <CommandPalette />
    </div>
  )
}
