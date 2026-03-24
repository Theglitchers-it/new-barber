import { z } from "zod"

export const createAppointmentSchema = z.object({
  serviceId: z.string().min(1, "Seleziona un servizio"),
  operatorId: z.string().min(1, "Seleziona un operatore"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato data non valido"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato ora non valido"),
})

export const updateAppointmentSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
  noShow: z.boolean().optional(),
})

export const rescheduleAppointmentSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato data non valido"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato ora non valido"),
  operatorId: z.string().min(1).optional(),
})

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>
