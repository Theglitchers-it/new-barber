// ============ ENUMS ============

export const APPOINTMENT_STATUS = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const

export const ORDER_STATUS = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  SHIPPED: "SHIPPED",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
} as const

export const USER_ROLE = {
  ADMIN: "ADMIN",
  CLIENT: "CLIENT",
} as const

export const LOYALTY_TYPE = {
  EARNED: "EARNED",
  REDEEMED: "REDEEMED",
} as const

export const NOTIFICATION_TYPE = {
  APPOINTMENT: "APPOINTMENT",
  ORDER: "ORDER",
  LOYALTY: "LOYALTY",
  SYSTEM: "SYSTEM",
} as const

export const PREFERRED_CONTACT = {
  EMAIL: "EMAIL",
  PHONE: "PHONE",
  WHATSAPP: "WHATSAPP",
} as const

export const WAITLIST_STATUS = {
  WAITING: "WAITING",
  NOTIFIED: "NOTIFIED",
  BOOKED: "BOOKED",
  EXPIRED: "EXPIRED",
} as const

// ============ LOYALTY TIERS ============

export const LOYALTY_TIER = {
  BRONZE: "BRONZE",
  SILVER: "SILVER",
  GOLD: "GOLD",
  PLATINUM: "PLATINUM",
} as const

export const LOYALTY_TIER_CONFIG: Record<string, {
  threshold: number
  multiplier: number
  discount: number
  label: string
  color: string
  nextTier: string | null
}> = {
  BRONZE:   { threshold: 0,    multiplier: 1,    discount: 0,    label: "Bronze",   color: "oklch(0.65 0.1 55)",   nextTier: "SILVER" },
  SILVER:   { threshold: 200,  multiplier: 1.25, discount: 0,    label: "Silver",   color: "oklch(0.7 0.01 250)",  nextTier: "GOLD" },
  GOLD:     { threshold: 500,  multiplier: 1.5,  discount: 0.05, label: "Gold",     color: "oklch(0.78 0.18 75)",  nextTier: "PLATINUM" },
  PLATINUM: { threshold: 1000, multiplier: 2,    discount: 0.10, label: "Platinum", color: "oklch(0.55 0.24 25)",  nextTier: null },
}

export function calculateTier(totalPointsEarned: number): string {
  const tiers = Object.entries(LOYALTY_TIER_CONFIG).sort((a, b) => b[1].threshold - a[1].threshold)
  for (const [key, config] of tiers) {
    if (totalPointsEarned >= config.threshold) return key
  }
  return LOYALTY_TIER.BRONZE
}

// ============ CHALLENGES ============

export const CHALLENGE_TYPE = {
  VISITS: "VISITS",
  SPENDING: "SPENDING",
  REVIEWS: "REVIEWS",
  PRODUCTS: "PRODUCTS",
} as const

export const challengeTypeLabels: Record<string, string> = {
  VISITS: "Visite",
  SPENDING: "Spesa",
  REVIEWS: "Recensioni",
  PRODUCTS: "Acquisti",
}

// ============ UI LABELS ============

// Appointment status
export const appointmentStatusLabels: Record<string, string> = {
  PENDING: "In attesa",
  CONFIRMED: "Confermato",
  IN_PROGRESS: "In corso",
  COMPLETED: "Completato",
  CANCELLED: "Cancellato",
}

export const appointmentStatusColors: Record<string, string> = {
  PENDING: "status-pending",
  CONFIRMED: "status-confirmed",
  IN_PROGRESS: "status-in-progress",
  COMPLETED: "status-completed",
  CANCELLED: "status-cancelled",
}

// Order status
export const orderStatusLabels: Record<string, string> = {
  PENDING: "In attesa",
  PROCESSING: "In lavorazione",
  SHIPPED: "Spedito",
  DELIVERED: "Consegnato",
  CANCELLED: "Cancellato",
}

export const orderStatusColors: Record<string, string> = {
  PENDING: "status-pending",
  PROCESSING: "status-confirmed",
  SHIPPED: "status-in-progress",
  DELIVERED: "status-completed",
  CANCELLED: "status-cancelled",
}
