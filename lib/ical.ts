interface AppointmentData {
  date: string | Date
  startTime: string // "HH:mm"
  endTime: string // "HH:mm"
  serviceName: string
  operatorName: string
  salonName?: string
  address?: string
  notes?: string
}

function formatICSDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
}

/** Escape ICS field values to prevent injection (RFC 5545 §3.3.11) */
function escapeICS(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n")
}

function combineDateAndTime(dateStr: string | Date, time: string): Date {
  const d = new Date(dateStr)
  const [hours, minutes] = time.split(":").map(Number)
  d.setHours(hours, minutes, 0, 0)
  return d
}

export function generateICS(appointment: AppointmentData): string {
  const start = combineDateAndTime(appointment.date, appointment.startTime)
  const end = combineDateAndTime(appointment.date, appointment.endTime)
  const summary = escapeICS(`${appointment.serviceName} con ${appointment.operatorName}`)
  const description = appointment.notes
    ? escapeICS(`${appointment.serviceName} con ${appointment.operatorName}\n${appointment.notes}`)
    : summary

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SalonPro//Appuntamento//IT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `DTSTART:${formatICSDate(start)}`,
    `DTEND:${formatICSDate(end)}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    appointment.address ? `LOCATION:${escapeICS(appointment.address)}` : "",
    `ORGANIZER;CN=${escapeICS(appointment.salonName || "SalonPro")}:mailto:noreply@salonpro.it`,
    "STATUS:CONFIRMED",
    `UID:${Date.now()}@salonpro.it`,
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n")
}

export function generateGoogleCalendarUrl(appointment: AppointmentData): string {
  const start = combineDateAndTime(appointment.date, appointment.startTime)
  const end = combineDateAndTime(appointment.date, appointment.endTime)
  const title = `${appointment.serviceName} con ${appointment.operatorName}`

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${formatICSDate(start)}/${formatICSDate(end)}`,
    details: appointment.notes || title,
    location: appointment.address || "",
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}
