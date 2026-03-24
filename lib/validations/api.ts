import { z } from "zod"

export const cancelAppointmentSchema = z.object({
  reason: z.string().trim().min(1, "Motivo richiesto").max(500, "Massimo 500 caratteri"),
})

export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5, "Valutazione non valida (1-5)"),
  comment: z.string().max(1000).optional(),
})

export const markNotificationsSchema = z.object({
  ids: z.array(z.string()).min(1, "IDs richiesti").max(100),
})

export const waitlistCreateSchema = z.object({
  serviceId: z.string().min(1, "Servizio obbligatorio"),
  date: z.string().min(1, "Data obbligatoria"),
  operatorId: z.string().optional(),
  startTime: z.string().optional(),
})
