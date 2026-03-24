import { describe, it, expect } from "vitest"
import {
  cancelAppointmentSchema,
  createReviewSchema,
  markNotificationsSchema,
  waitlistCreateSchema,
} from "@/lib/validations/api"

describe("API Validation Schemas", () => {
  describe("cancelAppointmentSchema", () => {
    it("accepts valid reason", () => {
      const result = cancelAppointmentSchema.safeParse({ reason: "Non posso venire" })
      expect(result.success).toBe(true)
    })

    it("rejects empty reason", () => {
      const result = cancelAppointmentSchema.safeParse({ reason: "" })
      expect(result.success).toBe(false)
    })

    it("rejects reason > 500 chars", () => {
      const result = cancelAppointmentSchema.safeParse({ reason: "x".repeat(501) })
      expect(result.success).toBe(false)
    })

    it("trims whitespace", () => {
      const result = cancelAppointmentSchema.safeParse({ reason: "  motivo  " })
      expect(result.success).toBe(true)
      if (result.success) expect(result.data.reason).toBe("motivo")
    })
  })

  describe("createReviewSchema", () => {
    it("accepts valid review", () => {
      const result = createReviewSchema.safeParse({ rating: 5, comment: "Ottimo!" })
      expect(result.success).toBe(true)
    })

    it("accepts review without comment", () => {
      const result = createReviewSchema.safeParse({ rating: 3 })
      expect(result.success).toBe(true)
    })

    it("rejects rating < 1", () => {
      const result = createReviewSchema.safeParse({ rating: 0 })
      expect(result.success).toBe(false)
    })

    it("rejects rating > 5", () => {
      const result = createReviewSchema.safeParse({ rating: 6 })
      expect(result.success).toBe(false)
    })

    it("rejects non-integer rating", () => {
      const result = createReviewSchema.safeParse({ rating: 3.5 })
      expect(result.success).toBe(false)
    })

    it("rejects comment > 1000 chars", () => {
      const result = createReviewSchema.safeParse({ rating: 5, comment: "x".repeat(1001) })
      expect(result.success).toBe(false)
    })
  })

  describe("markNotificationsSchema", () => {
    it("accepts valid IDs array", () => {
      const result = markNotificationsSchema.safeParse({ ids: ["id1", "id2"] })
      expect(result.success).toBe(true)
    })

    it("rejects empty array", () => {
      const result = markNotificationsSchema.safeParse({ ids: [] })
      expect(result.success).toBe(false)
    })

    it("rejects > 100 IDs", () => {
      const ids = Array.from({ length: 101 }, (_, i) => `id-${i}`)
      const result = markNotificationsSchema.safeParse({ ids })
      expect(result.success).toBe(false)
    })
  })

  describe("waitlistCreateSchema", () => {
    it("accepts valid waitlist entry", () => {
      const result = waitlistCreateSchema.safeParse({
        serviceId: "svc-123",
        date: "2026-04-01",
      })
      expect(result.success).toBe(true)
    })

    it("rejects missing serviceId", () => {
      const result = waitlistCreateSchema.safeParse({ date: "2026-04-01" })
      expect(result.success).toBe(false)
    })

    it("rejects missing date", () => {
      const result = waitlistCreateSchema.safeParse({ serviceId: "svc-123" })
      expect(result.success).toBe(false)
    })
  })
})
