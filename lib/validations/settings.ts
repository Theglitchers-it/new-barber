import { z } from "zod"

const httpsUrl = z.string().url("URL non valido").refine(
  (url) => url.startsWith("https://"),
  "Solo URL HTTPS sono permessi"
).optional().or(z.literal(""))

export const operatorSchema = z.object({
  name: z.string().min(2, "Il nome deve avere almeno 2 caratteri"),
  role: z.string().min(2, "Il ruolo deve avere almeno 2 caratteri"),
  specializations: z.string().optional(),
  email: z.string().email("Email non valida").optional().or(z.literal("")),
  phone: z.string().optional(),
  bio: z.string().optional(),
  commission: z.number().min(0).max(100).optional(),
  image: httpsUrl,
  active: z.boolean().optional(),
})

export const operatorUpdateSchema = operatorSchema.partial()

export const serviceSchema = z.object({
  name: z.string().min(2, "Il nome deve avere almeno 2 caratteri"),
  description: z.string().optional(),
  price: z.number().min(0, "Il prezzo deve essere positivo"),
  duration: z.number().min(5, "La durata minima è 5 minuti"),
  category: z.string().min(1, "La categoria è obbligatoria"),
  image: httpsUrl,
  popular: z.boolean().optional(),
  active: z.boolean().optional(),
})

export const productSchema = z.object({
  name: z.string().min(2, "Il nome deve avere almeno 2 caratteri"),
  description: z.string().optional(),
  category: z.string().min(1, "La categoria è obbligatoria"),
  price: z.number().min(0, "Il prezzo deve essere positivo"),
  originalPrice: z.number().min(0).optional(),
  stock: z.number().min(0).optional(),
  image: httpsUrl,
  active: z.boolean().optional(),
})

export const couponSchema = z.object({
  code: z.string().min(2, "Il codice deve avere almeno 2 caratteri"),
  type: z.enum(["PERCENTAGE", "FIXED"]),
  value: z.number().min(0, "Il valore deve essere positivo"),
  minOrder: z.number().min(0).optional(),
  maxUses: z.number().min(1).optional(),
  expiresAt: z.string().optional(),
  active: z.boolean().optional(),
})

export const businessSettingsSchema = z.object({
  salonName: z.string().min(1, "Il nome del salone è obbligatorio"),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email non valida").optional().or(z.literal("")),
  openTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato orario non valido"),
  closeTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato orario non valido"),
  slotDuration: z.number().min(5).max(120).optional(),
  loyaltyPointsPerEuro: z.number().min(0).max(100).optional(),
  loyaltyRedemptionRate: z.number().min(0).max(100).optional(),
  cancellationPolicy: z.string().optional(),
  depositRequired: z.boolean().optional(),
  depositAmount: z.number().min(0).optional(),
  logo: httpsUrl,
  coverImage: httpsUrl,
})

export const scheduleSchema = z.object({
  availabilities: z.array(
    z.object({
      dayOfWeek: z.number().min(0).max(6),
      startTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato orario non valido"),
      endTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato orario non valido"),
    })
  ),
})

export type OperatorInput = z.infer<typeof operatorSchema>
export type OperatorUpdateInput = z.infer<typeof operatorUpdateSchema>
export type ServiceInput = z.infer<typeof serviceSchema>
export type ProductInput = z.infer<typeof productSchema>
export type CouponInput = z.infer<typeof couponSchema>
export type BusinessSettingsInput = z.infer<typeof businessSettingsSchema>
export type ScheduleInput = z.infer<typeof scheduleSchema>
