import { z } from "zod"

export const PASSWORD_MIN_LENGTH = 8

const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `La password deve avere almeno ${PASSWORD_MIN_LENGTH} caratteri`)
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "La password deve contenere almeno una maiuscola, una minuscola e un numero"
  )

export const loginSchema = z.object({
  email: z.string().email("Email non valida"),
  password: z.string().min(1, "Password richiesta"),
})

export const registerSchema = z.object({
  name: z.string().min(2, "Il nome deve avere almeno 2 caratteri"),
  email: z.string().email("Email non valida"),
  password: passwordSchema,
  confirmPassword: z.string(),
  phone: z.string().max(20).optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Le password non coincidono",
  path: ["confirmPassword"],
})

export const profileUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().max(20).optional(),
  hairType: z.string().max(50).optional(),
  preferredContact: z.string().max(50).optional(),
  notes: z.string().max(500).optional(),
})

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Password attuale richiesta"),
  newPassword: passwordSchema,
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
