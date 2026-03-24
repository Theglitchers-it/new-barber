import { NextResponse } from "next/server"
import { hashSync } from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { registerSchema } from "@/lib/validations/auth"
import { registerLimiter, getRateLimitResponse } from "@/lib/rate-limit"

export async function POST(request: Request) {
  try {
    // Rate limiting per IP
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
    const { success } = registerLimiter.check(3, ip)
    if (!success) return getRateLimitResponse()

    const body = await request.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Registrazione non riuscita", details: parsed.error.errors.map(e => e.message) },
        { status: 400 }
      )
    }

    const { name, email, password, phone } = parsed.data

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Registrazione non riuscita" },
        { status: 400 }
      )
    }

    const hashedPassword = hashSync(password, 12)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        hashedPassword,
        phone: phone || null,
        role: "CLIENT",
      },
    })

    return NextResponse.json(
      { message: "Account creato con successo" },
      { status: 201 }
    )
  } catch {
    return NextResponse.json(
      { error: "Errore durante la registrazione" },
      { status: 500 }
    )
  }
}
