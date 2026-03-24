import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { whatsapp } from "@/lib/whatsapp"
import { USER_ROLE } from "@/lib/constants"

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user || session.user.role !== USER_ROLE.ADMIN) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { phone, message } = body

    if (!phone || !message) {
      return NextResponse.json(
        { error: "Numero di telefono e messaggio sono obbligatori" },
        { status: 400 }
      )
    }

    // Basic phone validation: strip spaces and ensure it looks like a number
    const cleanPhone = phone.replace(/[\s\-()]/g, "")
    if (!/^\+?\d{8,15}$/.test(cleanPhone)) {
      return NextResponse.json(
        { error: "Formato numero di telefono non valido" },
        { status: 400 }
      )
    }

    const success = await whatsapp.sendMessage(cleanPhone, message)

    if (!success) {
      return NextResponse.json(
        { error: "Errore nell'invio del messaggio" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, phone: cleanPhone })
  } catch (error) {
    console.error("[WhatsApp Send] Errore:", error)
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 }
    )
  }
}
