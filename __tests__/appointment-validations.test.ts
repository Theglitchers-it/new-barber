import { describe, it, expect } from "vitest"
import {
  createAppointmentSchema,
  updateAppointmentSchema,
  rescheduleAppointmentSchema,
} from "@/lib/validations/appointment"

describe("Appointment Validation Schemas", () => {
  describe("createAppointmentSchema", () => {
    const validData = {
      serviceId: "svc-123",
      operatorId: "op-456",
      date: "2026-04-15",
      startTime: "14:30",
    }

    it("accepts valid appointment", () => {
      const result = createAppointmentSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it("rejects missing serviceId", () => {
      const result = createAppointmentSchema.safeParse({ ...validData, serviceId: "" })
      expect(result.success).toBe(false)
    })

    it("rejects missing operatorId", () => {
      const result = createAppointmentSchema.safeParse({ ...validData, operatorId: "" })
      expect(result.success).toBe(false)
    })

    it("rejects invalid date format", () => {
      const result = createAppointmentSchema.safeParse({ ...validData, date: "15/04/2026" })
      expect(result.success).toBe(false)
    })

    it("rejects invalid date format (no dashes)", () => {
      const result = createAppointmentSchema.safeParse({ ...validData, date: "20260415" })
      expect(result.success).toBe(false)
    })

    it("rejects invalid time format", () => {
      const result = createAppointmentSchema.safeParse({ ...validData, startTime: "2:30pm" })
      expect(result.success).toBe(false)
    })

    it("accepts time with leading zero", () => {
      const result = createAppointmentSchema.safeParse({ ...validData, startTime: "09:00" })
      expect(result.success).toBe(true)
    })
  })

  describe("updateAppointmentSchema", () => {
    it("accepts valid status update", () => {
      const result = updateAppointmentSchema.safeParse({ status: "CONFIRMED" })
      expect(result.success).toBe(true)
    })

    it("accepts all valid statuses", () => {
      const statuses = ["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]
      for (const status of statuses) {
        expect(updateAppointmentSchema.safeParse({ status }).success).toBe(true)
      }
    })

    it("rejects invalid status", () => {
      const result = updateAppointmentSchema.safeParse({ status: "UNKNOWN" })
      expect(result.success).toBe(false)
    })

    it("accepts optional noShow", () => {
      const result = updateAppointmentSchema.safeParse({ status: "COMPLETED", noShow: true })
      expect(result.success).toBe(true)
    })
  })

  describe("rescheduleAppointmentSchema", () => {
    it("accepts valid reschedule", () => {
      const result = rescheduleAppointmentSchema.safeParse({
        date: "2026-04-20",
        startTime: "10:00",
      })
      expect(result.success).toBe(true)
    })

    it("accepts optional operatorId", () => {
      const result = rescheduleAppointmentSchema.safeParse({
        date: "2026-04-20",
        startTime: "10:00",
        operatorId: "op-789",
      })
      expect(result.success).toBe(true)
    })

    it("rejects invalid date", () => {
      const result = rescheduleAppointmentSchema.safeParse({
        date: "tomorrow",
        startTime: "10:00",
      })
      expect(result.success).toBe(false)
    })
  })
})
