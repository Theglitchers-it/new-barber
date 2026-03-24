import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { USER_ROLE } from "@/lib/constants"
import type { SafeParseReturnType } from "zod"

type Session = Awaited<ReturnType<typeof auth>>
type AuthenticatedSession = NonNullable<Session> & { user: NonNullable<NonNullable<Session>["user"]> }
type AuthResult =
  | { session: AuthenticatedSession; error?: never }
  | { session?: never; error: NextResponse }

/**
 * Require authenticated session. Returns session or error response.
 */
export async function requireAuth(): Promise<AuthResult> {
  const session = await auth()
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Non autorizzato" }, { status: 401 }) }
  }
  return { session: session as AuthenticatedSession }
}

/**
 * Require authenticated admin session. Returns session or error response.
 */
export async function requireAdmin(): Promise<AuthResult> {
  const result = await requireAuth()
  if (result.error) return result
  if (result.session.user.role !== USER_ROLE.ADMIN) {
    return { error: NextResponse.json({ error: "Non autorizzato" }, { status: 403 }) }
  }
  return result
}

/**
 * Return 400 response from failed Zod parse result.
 */
export function validationError(parsed: SafeParseReturnType<any, any>): NextResponse {
  const message = !parsed.success
    ? parsed.error.errors[0]?.message ?? "Dati non validi"
    : "Dati non validi"
  return NextResponse.json({ error: message }, { status: 400 })
}
