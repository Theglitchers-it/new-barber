import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

const publicRoutes = ["/", "/login", "/registrati", "/api/auth", "/shop", "/embed"]

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth

  // Allow public routes
  if (publicRoutes.some((route) => pathname === route || (route !== "/" && pathname.startsWith(route)))) {
    // Redirect logged-in users away from auth pages
    if (isLoggedIn && (pathname === "/login" || pathname === "/registrati")) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }
    return NextResponse.next()
  }

  // Redirect to login if not authenticated
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // Admin-only routes
  const adminRoutes = ["/clienti", "/impostazioni", "/operatori", "/recensioni", "/report", "/onboarding"]
  if (adminRoutes.some((route) => pathname.startsWith(route))) {
    const role = req.auth?.user?.role
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next|static|favicon|icon|apple-icon|placeholder|api/auth|.*\\..*).*)"],
}
