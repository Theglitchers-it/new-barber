import { describe, it, expect } from "vitest"
import {
  APPOINTMENT_STATUS,
  ORDER_STATUS,
  USER_ROLE,
  LOYALTY_TYPE,
  NOTIFICATION_TYPE,
  appointmentStatusLabels,
  appointmentStatusColors,
  orderStatusLabels,
  orderStatusColors,
} from "@/lib/constants"

describe("Constants", () => {
  describe("APPOINTMENT_STATUS", () => {
    it("has all required statuses", () => {
      expect(APPOINTMENT_STATUS.PENDING).toBe("PENDING")
      expect(APPOINTMENT_STATUS.CONFIRMED).toBe("CONFIRMED")
      expect(APPOINTMENT_STATUS.IN_PROGRESS).toBe("IN_PROGRESS")
      expect(APPOINTMENT_STATUS.COMPLETED).toBe("COMPLETED")
      expect(APPOINTMENT_STATUS.CANCELLED).toBe("CANCELLED")
    })

    it("has labels for every status", () => {
      for (const status of Object.values(APPOINTMENT_STATUS)) {
        expect(appointmentStatusLabels[status]).toBeDefined()
        expect(typeof appointmentStatusLabels[status]).toBe("string")
      }
    })

    it("has colors for every status", () => {
      for (const status of Object.values(APPOINTMENT_STATUS)) {
        expect(appointmentStatusColors[status]).toBeDefined()
      }
    })
  })

  describe("ORDER_STATUS", () => {
    it("has all required statuses", () => {
      expect(ORDER_STATUS.PENDING).toBe("PENDING")
      expect(ORDER_STATUS.PROCESSING).toBe("PROCESSING")
      expect(ORDER_STATUS.SHIPPED).toBe("SHIPPED")
      expect(ORDER_STATUS.DELIVERED).toBe("DELIVERED")
      expect(ORDER_STATUS.CANCELLED).toBe("CANCELLED")
    })

    it("has labels for every status", () => {
      for (const status of Object.values(ORDER_STATUS)) {
        expect(orderStatusLabels[status]).toBeDefined()
      }
    })

    it("has colors for every status", () => {
      for (const status of Object.values(ORDER_STATUS)) {
        expect(orderStatusColors[status]).toBeDefined()
      }
    })
  })

  describe("USER_ROLE", () => {
    it("has ADMIN and CLIENT", () => {
      expect(USER_ROLE.ADMIN).toBe("ADMIN")
      expect(USER_ROLE.CLIENT).toBe("CLIENT")
    })
  })

  describe("LOYALTY_TYPE", () => {
    it("has EARNED and REDEEMED", () => {
      expect(LOYALTY_TYPE.EARNED).toBe("EARNED")
      expect(LOYALTY_TYPE.REDEEMED).toBe("REDEEMED")
    })
  })

  describe("NOTIFICATION_TYPE", () => {
    it("has all notification types", () => {
      expect(NOTIFICATION_TYPE.APPOINTMENT).toBe("APPOINTMENT")
      expect(NOTIFICATION_TYPE.ORDER).toBe("ORDER")
      expect(NOTIFICATION_TYPE.LOYALTY).toBe("LOYALTY")
      expect(NOTIFICATION_TYPE.SYSTEM).toBe("SYSTEM")
    })
  })
})
