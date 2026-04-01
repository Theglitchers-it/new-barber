export type RecurringPattern = "WEEKLY" | "BIWEEKLY" | "MONTHLY"

export function generateRecurringDates(
  startDate: Date,
  pattern: RecurringPattern,
  endDate: Date
): Date[] {
  const dates: Date[] = []
  const current = new Date(startDate)
  const maxInstances = 52 // safety cap

  while (current <= endDate && dates.length < maxInstances) {
    dates.push(new Date(current))

    switch (pattern) {
      case "WEEKLY":
        current.setDate(current.getDate() + 7)
        break
      case "BIWEEKLY":
        current.setDate(current.getDate() + 14)
        break
      case "MONTHLY":
        current.setMonth(current.getMonth() + 1)
        break
    }
  }

  return dates
}

export const RECURRING_PATTERNS: { value: RecurringPattern; label: string }[] = [
  { value: "WEEKLY", label: "Ogni settimana" },
  { value: "BIWEEKLY", label: "Ogni 2 settimane" },
  { value: "MONTHLY", label: "Ogni mese" },
]
