import { prisma } from "@/lib/prisma"
import { APPOINTMENT_STATUS, USER_ROLE } from "@/lib/constants"

// ─── State Machine ───────────────────────────────────────────────

type ConversationStep =
  | "IDLE"
  | "AWAITING_SERVICE"
  | "AWAITING_OPERATOR"
  | "AWAITING_DATE"
  | "AWAITING_TIME"
  | "CONFIRMING"

interface ConversationState {
  step: ConversationStep
  serviceId?: string
  serviceName?: string
  serviceDuration?: number
  operatorId?: string
  operatorName?: string
  date?: Date
  dateLabel?: string
  startTime?: string
  lastActivity: number
}

const conversations = new Map<string, ConversationState>()

const TIMEOUT_MS = 10 * 60 * 1000 // 10 minuti
const MAX_CONVERSATIONS = 1000

// Periodic eviction of expired conversations to prevent memory leaks
function evictExpiredConversations() {
  const now = Date.now()
  for (const [phone, state] of conversations) {
    if (now - state.lastActivity > TIMEOUT_MS) {
      conversations.delete(phone)
    }
  }
}

// Run eviction every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(evictExpiredConversations, 5 * 60 * 1000)
}

function getState(phone: string): ConversationState {
  const state = conversations.get(phone)
  if (state && Date.now() - state.lastActivity > TIMEOUT_MS) {
    conversations.delete(phone)
    return { step: "IDLE", lastActivity: Date.now() }
  }
  return state ?? { step: "IDLE", lastActivity: Date.now() }
}

function setState(phone: string, state: ConversationState) {
  // Evict if at capacity
  if (conversations.size >= MAX_CONVERSATIONS && !conversations.has(phone)) {
    evictExpiredConversations()
  }
  conversations.set(phone, { ...state, lastActivity: Date.now() })
}

function clearState(phone: string) {
  conversations.delete(phone)
}

// ─── Italian date parsing ────────────────────────────────────────

function parseItalianDate(text: string): Date | null {
  const cleaned = text.trim().toLowerCase()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (cleaned === "oggi") {
    return today
  }

  if (cleaned === "domani") {
    const d = new Date(today)
    d.setDate(d.getDate() + 1)
    return d
  }

  if (cleaned === "dopodomani") {
    const d = new Date(today)
    d.setDate(d.getDate() + 2)
    return d
  }

  const dayNames: Record<string, number> = {
    domenica: 0,
    lunedi: 1,
    "lunedì": 1,
    martedi: 2,
    "martedì": 2,
    mercoledi: 3,
    "mercoledì": 3,
    giovedi: 4,
    "giovedì": 4,
    venerdi: 5,
    "venerdì": 5,
    sabato: 6,
  }

  if (dayNames[cleaned] !== undefined) {
    const targetDay = dayNames[cleaned]
    const currentDay = today.getDay()
    let diff = targetDay - currentDay
    if (diff <= 0) diff += 7
    const d = new Date(today)
    d.setDate(d.getDate() + diff)
    return d
  }

  // DD/MM format
  const ddmm = cleaned.match(/^(\d{1,2})[/\-.](\d{1,2})$/)
  if (ddmm) {
    const day = parseInt(ddmm[1], 10)
    const month = parseInt(ddmm[2], 10) - 1
    const year = today.getFullYear()
    const d = new Date(year, month, day)
    if (d < today) d.setFullYear(year + 1)
    return d
  }

  // DD/MM/YYYY format
  const ddmmyyyy = cleaned.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/)
  if (ddmmyyyy) {
    const day = parseInt(ddmmyyyy[1], 10)
    const month = parseInt(ddmmyyyy[2], 10) - 1
    let year = parseInt(ddmmyyyy[3], 10)
    if (year < 100) year += 2000
    return new Date(year, month, day)
  }

  return null
}

function formatDate(date: Date): string {
  const days = ["Domenica", "Lunedi", "Martedi", "Mercoledi", "Giovedi", "Venerdi", "Sabato"]
  const months = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"]
  return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`
}

function toISODateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

// ─── Main entry point ────────────────────────────────────────────

export async function processMessage(phone: string, message: string): Promise<string> {
  const msg = message.trim().toLowerCase()
  const state = getState(phone)

  // ─── Global commands ──────────────────────────────────────

  if (msg === "stato" || msg === "status") {
    return handleStatus(phone)
  }

  if (msg === "annulla" || msg === "cancella") {
    return handleCancel(phone)
  }

  if (msg === "reset" || msg === "esci") {
    clearState(phone)
    return "Conversazione resettata. Scrivi *prenota* per iniziare una nuova prenotazione."
  }

  // ─── State machine ────────────────────────────────────────

  switch (state.step) {
    case "IDLE":
      return handleIdle(phone, msg)
    case "AWAITING_SERVICE":
      return handleServiceSelection(phone, msg, state)
    case "AWAITING_OPERATOR":
      return handleOperatorSelection(phone, msg, state)
    case "AWAITING_DATE":
      return handleDateSelection(phone, msg, state)
    case "AWAITING_TIME":
      return handleTimeSelection(phone, msg, state)
    case "CONFIRMING":
      return handleConfirmation(phone, msg, state)
    default:
      clearState(phone)
      return "Mi scusi, qualcosa non ha funzionato. Scrivi *prenota* per iniziare."
  }
}

// ─── Handlers ────────────────────────────────────────────────────

async function handleIdle(phone: string, msg: string): Promise<string> {
  const greetings = ["ciao", "salve", "buongiorno", "buonasera", "hey", "hola", "hi", "hello"]
  const bookingWords = ["prenota", "prenotare", "book", "prenotazione", "appuntamento"]

  const isGreeting = greetings.some((g) => msg.includes(g))
  const isBooking = bookingWords.some((b) => msg.includes(b))

  if (!isGreeting && !isBooking) {
    return (
      "Ciao! Benvenuto al nostro salone. Ecco cosa posso fare:\n\n" +
      "*prenota* - Prenota un appuntamento\n" +
      "*stato* - Verifica il tuo prossimo appuntamento\n" +
      "*annulla* - Annulla l'ultimo appuntamento\n\n" +
      "Come posso aiutarti?"
    )
  }

  // List active services
  const services = await prisma.service.findMany({
    where: { active: true },
    orderBy: { category: "asc" },
  })

  if (services.length === 0) {
    return "Mi dispiace, al momento non ci sono servizi disponibili. Riprova piu tardi."
  }

  let reply = "Perfetto! Ecco i nostri servizi:\n\n"
  services.forEach((s, i) => {
    reply += `*${i + 1}.* ${s.name} - ${s.duration} min - ${s.price.toFixed(2)}\u20AC\n`
  })
  reply += "\nRispondi con il *numero* del servizio che desideri."

  setState(phone, {
    step: "AWAITING_SERVICE",
    lastActivity: Date.now(),
  })

  return reply
}

async function handleServiceSelection(
  phone: string,
  msg: string,
  state: ConversationState
): Promise<string> {
  const services = await prisma.service.findMany({
    where: { active: true },
    orderBy: { category: "asc" },
  })

  const num = parseInt(msg, 10)
  if (isNaN(num) || num < 1 || num > services.length) {
    return `Per favore rispondi con un numero da 1 a ${services.length}.`
  }

  const selected = services[num - 1]

  // Find operators who could do this service (all active operators)
  const operators = await prisma.operator.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  })

  if (operators.length === 0) {
    clearState(phone)
    return "Mi dispiace, al momento non ci sono operatori disponibili."
  }

  let reply = `Hai scelto: *${selected.name}* (${selected.duration} min - ${selected.price.toFixed(2)}\u20AC)\n\n`
  reply += "Con quale operatore preferisci?\n\n"
  operators.forEach((op, i) => {
    reply += `*${i + 1}.* ${op.name} - ${op.role}\n`
  })
  reply += "\nRispondi con il *numero* dell'operatore."

  setState(phone, {
    ...state,
    step: "AWAITING_OPERATOR",
    serviceId: selected.id,
    serviceName: selected.name,
    serviceDuration: selected.duration,
  })

  return reply
}

async function handleOperatorSelection(
  phone: string,
  msg: string,
  state: ConversationState
): Promise<string> {
  const operators = await prisma.operator.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  })

  const num = parseInt(msg, 10)
  if (isNaN(num) || num < 1 || num > operators.length) {
    return `Per favore rispondi con un numero da 1 a ${operators.length}.`
  }

  const selected = operators[num - 1]

  setState(phone, {
    ...state,
    step: "AWAITING_DATE",
    operatorId: selected.id,
    operatorName: selected.name,
  })

  return (
    `Operatore: *${selected.name}*\n\n` +
    "Quando vorresti prenotare?\n\n" +
    "Puoi scrivere:\n" +
    "- *oggi* o *domani*\n" +
    "- Un giorno della settimana (es. *lunedi*, *martedi*)\n" +
    "- Una data (es. *25/03* o *25/03/2026*)"
  )
}

async function handleDateSelection(
  phone: string,
  msg: string,
  state: ConversationState
): Promise<string> {
  const date = parseItalianDate(msg)

  if (!date) {
    return "Non ho capito la data. Prova con *oggi*, *domani*, un giorno (es. *lunedi*) o una data (es. *25/03*)."
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (date < today) {
    return "Non puoi prenotare nel passato. Scegli una data futura."
  }

  const dayOfWeek = date.getDay()

  // Check operator availability for this day
  const availability = await prisma.operatorAvailability.findFirst({
    where: {
      operatorId: state.operatorId!,
      dayOfWeek,
    },
  })

  if (!availability) {
    return `Mi dispiace, *${state.operatorName}* non lavora il ${formatDate(date)}. Prova con un altro giorno.`
  }

  // Get existing appointments for that operator on that date
  const dateStr = toISODateString(date)
  const existing = await prisma.appointment.findMany({
    where: {
      operatorId: state.operatorId!,
      date: new Date(dateStr),
      status: { not: APPOINTMENT_STATUS.CANCELLED },
    },
  })

  // Get business settings for slot duration
  const settings = await prisma.businessSettings.findUnique({
    where: { id: "default" },
  })
  const slotDuration = settings?.slotDuration ?? 30
  const serviceDuration = state.serviceDuration ?? slotDuration

  // Generate available slots
  const [startH, startM] = availability.startTime.split(":").map(Number)
  const [endH, endM] = availability.endTime.split(":").map(Number)
  const startMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM

  const slots: string[] = []

  for (let t = startMinutes; t + serviceDuration <= endMinutes; t += slotDuration) {
    const slotStart = `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`
    const slotEnd = `${String(Math.floor((t + serviceDuration) / 60)).padStart(2, "0")}:${String((t + serviceDuration) % 60).padStart(2, "0")}`

    const hasConflict = existing.some(
      (apt) => apt.startTime < slotEnd && apt.endTime > slotStart
    )

    if (!hasConflict) {
      slots.push(slotStart)
    }
  }

  if (slots.length === 0) {
    return `Mi dispiace, non ci sono orari disponibili per il ${formatDate(date)} con *${state.operatorName}*. Prova un altro giorno.`
  }

  let reply = `Orari disponibili per *${formatDate(date)}*:\n\n`
  slots.forEach((s, i) => {
    reply += `*${i + 1}.* ${s}\n`
  })
  reply += "\nRispondi con il *numero* dell'orario che preferisci."

  setState(phone, {
    ...state,
    step: "AWAITING_TIME",
    date,
    dateLabel: formatDate(date),
  })

  return reply
}

async function handleTimeSelection(
  phone: string,
  msg: string,
  state: ConversationState
): Promise<string> {
  // Re-compute available slots to validate
  const date = state.date!
  const dayOfWeek = date.getDay()

  const availability = await prisma.operatorAvailability.findFirst({
    where: { operatorId: state.operatorId!, dayOfWeek },
  })

  if (!availability) {
    clearState(phone)
    return "Errore: operatore non disponibile. Scrivi *prenota* per ricominciare."
  }

  const dateStr = toISODateString(date)
  const existing = await prisma.appointment.findMany({
    where: {
      operatorId: state.operatorId!,
      date: new Date(dateStr),
      status: { not: APPOINTMENT_STATUS.CANCELLED },
    },
  })

  const settings = await prisma.businessSettings.findUnique({ where: { id: "default" } })
  const slotDuration = settings?.slotDuration ?? 30
  const serviceDuration = state.serviceDuration ?? slotDuration

  const [startH, startM] = availability.startTime.split(":").map(Number)
  const [endH, endM] = availability.endTime.split(":").map(Number)
  const startMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM

  const slots: string[] = []
  for (let t = startMinutes; t + serviceDuration <= endMinutes; t += slotDuration) {
    const slotStart = `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`
    const slotEnd = `${String(Math.floor((t + serviceDuration) / 60)).padStart(2, "0")}:${String((t + serviceDuration) % 60).padStart(2, "0")}`

    const hasConflict = existing.some(
      (apt) => apt.startTime < slotEnd && apt.endTime > slotStart
    )
    if (!hasConflict) slots.push(slotStart)
  }

  // User can reply with number or time directly
  let selectedTime: string | null = null

  const num = parseInt(msg, 10)
  if (!isNaN(num) && num >= 1 && num <= slots.length) {
    selectedTime = slots[num - 1]
  } else {
    // Try to match HH:MM format
    const timeMatch = msg.match(/^(\d{1,2})[:\.](\d{2})$/)
    if (timeMatch) {
      const t = `${timeMatch[1].padStart(2, "0")}:${timeMatch[2]}`
      if (slots.includes(t)) {
        selectedTime = t
      }
    }
  }

  if (!selectedTime) {
    return `Per favore rispondi con un numero da 1 a ${slots.length}, oppure un orario valido (es. 10:00).`
  }

  // Calculate service price
  const service = await prisma.service.findUnique({ where: { id: state.serviceId! } })
  const price = service?.price ?? 0

  const [sh, sm] = selectedTime.split(":").map(Number)
  const endMin = sh * 60 + sm + serviceDuration
  const endTime = `${String(Math.floor(endMin / 60)).padStart(2, "0")}:${String(endMin % 60).padStart(2, "0")}`

  setState(phone, {
    ...state,
    step: "CONFIRMING",
    startTime: selectedTime,
  })

  return (
    "Riepilogo prenotazione:\n\n" +
    `\u2702\uFE0F Servizio: *${state.serviceName}*\n` +
    `\uD83D\uDC87 Operatore: *${state.operatorName}*\n` +
    `\uD83D\uDCC5 Data: *${state.dateLabel}*\n` +
    `\u23F0 Orario: *${selectedTime} - ${endTime}*\n` +
    `\uD83D\uDCB0 Prezzo: *${price.toFixed(2)}\u20AC*\n\n` +
    "Confermi? Rispondi *Si* o *No*."
  )
}

async function handleConfirmation(
  phone: string,
  msg: string,
  state: ConversationState
): Promise<string> {
  const positive = ["si", "sì", "yes", "ok", "confermo", "conferma", "s"]
  const negative = ["no", "n", "annulla", "cancella"]

  if (negative.some((n) => msg === n)) {
    clearState(phone)
    return "Prenotazione annullata. Scrivi *prenota* per iniziare di nuovo."
  }

  if (!positive.some((p) => msg === p)) {
    return "Rispondi *Si* per confermare o *No* per annullare."
  }

  // Find or create user by phone
  let user = await prisma.user.findFirst({
    where: { phone },
  })

  if (!user) {
    user = await prisma.user.create({
      data: {
        phone,
        email: `whatsapp_${phone.replace(/\+/g, "")}@placeholder.local`,
        name: `WhatsApp ${phone}`,
        role: USER_ROLE.CLIENT,
      },
    })
  }

  const service = await prisma.service.findUnique({ where: { id: state.serviceId! } })
  if (!service) {
    clearState(phone)
    return "Errore: servizio non trovato. Scrivi *prenota* per ricominciare."
  }

  const dateStr = toISODateString(state.date!)
  const startTime = state.startTime!
  const [sh, sm] = startTime.split(":").map(Number)
  const endMin = sh * 60 + sm + (state.serviceDuration ?? 30)
  const endTime = `${String(Math.floor(endMin / 60)).padStart(2, "0")}:${String(endMin % 60).padStart(2, "0")}`

  try {
    const appointment = await prisma.$transaction(async (tx) => {
      // Check for conflicts one last time
      const conflict = await tx.appointment.findFirst({
        where: {
          operatorId: state.operatorId!,
          date: new Date(dateStr),
          status: { not: APPOINTMENT_STATUS.CANCELLED },
          OR: [{ startTime: { lt: endTime }, endTime: { gt: startTime } }],
        },
      })

      if (conflict) {
        throw new Error("CONFLICT")
      }

      return tx.appointment.create({
        data: {
          userId: user.id,
          serviceId: state.serviceId!,
          operatorId: state.operatorId!,
          date: new Date(dateStr),
          startTime,
          endTime,
          totalPrice: service.price,
          status: APPOINTMENT_STATUS.CONFIRMED,
        },
      })
    })

    clearState(phone)

    return (
      "Prenotazione confermata! \u2705\n\n" +
      `\u2702\uFE0F ${state.serviceName}\n` +
      `\uD83D\uDC87 ${state.operatorName}\n` +
      `\uD83D\uDCC5 ${state.dateLabel}\n` +
      `\u23F0 ${startTime} - ${endTime}\n\n` +
      `ID: ${appointment.id.slice(0, 8)}\n\n` +
      "Per controllare lo stato scrivi *stato*.\n" +
      "Per annullare scrivi *annulla*."
    )
  } catch (err) {
    if (err instanceof Error && err.message === "CONFLICT") {
      setState(phone, { ...state, step: "AWAITING_TIME" })
      return "Mi dispiace, questo orario non e piu disponibile. Scegli un altro orario."
    }
    console.error("[WhatsApp Bot] Errore creazione appuntamento:", err)
    clearState(phone)
    return "Si e verificato un errore. Riprova piu tardi o scrivi *prenota* per ricominciare."
  }
}

// ─── Status & Cancel ─────────────────────────────────────────────

async function handleStatus(phone: string): Promise<string> {
  const user = await prisma.user.findFirst({ where: { phone } })

  if (!user) {
    return "Non ho trovato prenotazioni associate a questo numero. Scrivi *prenota* per prenotare."
  }

  const now = new Date()
  const appointment = await prisma.appointment.findFirst({
    where: {
      userId: user.id,
      status: { in: [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.CONFIRMED] },
      date: { gte: now },
    },
    include: { service: true, operator: true },
    orderBy: { date: "asc" },
  })

  if (!appointment) {
    return "Non hai appuntamenti futuri. Scrivi *prenota* per prenotarne uno!"
  }

  return (
    "Il tuo prossimo appuntamento:\n\n" +
    `\u2702\uFE0F ${appointment.service.name}\n` +
    `\uD83D\uDC87 ${appointment.operator.name}\n` +
    `\uD83D\uDCC5 ${formatDate(appointment.date)}\n` +
    `\u23F0 ${appointment.startTime} - ${appointment.endTime}\n` +
    `\uD83D\uDCB0 ${appointment.totalPrice.toFixed(2)}\u20AC\n` +
    `\nStato: *${appointment.status}*`
  )
}

async function handleCancel(phone: string): Promise<string> {
  const user = await prisma.user.findFirst({ where: { phone } })

  if (!user) {
    return "Non ho trovato prenotazioni associate a questo numero."
  }

  const now = new Date()
  const appointment = await prisma.appointment.findFirst({
    where: {
      userId: user.id,
      status: { in: [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.CONFIRMED] },
      date: { gte: now },
    },
    orderBy: { date: "asc" },
    include: { service: true, operator: true },
  })

  if (!appointment) {
    return "Non hai appuntamenti futuri da annullare."
  }

  await prisma.appointment.update({
    where: { id: appointment.id },
    data: {
      status: APPOINTMENT_STATUS.CANCELLED,
      cancellationReason: "Annullato via WhatsApp",
      cancelledAt: new Date(),
    },
  })

  clearState(phone)

  return (
    "Appuntamento annullato.\n\n" +
    `\u2702\uFE0F ${appointment.service.name}\n` +
    `\uD83D\uDCC5 ${formatDate(appointment.date)} alle ${appointment.startTime}\n\n` +
    "Scrivi *prenota* per prenotare un nuovo appuntamento."
  )
}
