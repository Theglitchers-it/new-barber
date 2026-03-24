import { describe, it, expect } from "vitest"
import { calculateTier, LOYALTY_TIER_CONFIG, LOYALTY_TIER } from "@/lib/constants"

describe("Loyalty System", () => {
  describe("calculateTier", () => {
    it("returns BRONZE for 0 points", () => {
      expect(calculateTier(0)).toBe(LOYALTY_TIER.BRONZE)
    })

    it("returns BRONZE for 199 points", () => {
      expect(calculateTier(199)).toBe(LOYALTY_TIER.BRONZE)
    })

    it("returns SILVER for 200 points", () => {
      expect(calculateTier(200)).toBe(LOYALTY_TIER.SILVER)
    })

    it("returns GOLD for 500 points", () => {
      expect(calculateTier(500)).toBe(LOYALTY_TIER.GOLD)
    })

    it("returns PLATINUM for 1000 points", () => {
      expect(calculateTier(1000)).toBe(LOYALTY_TIER.PLATINUM)
    })

    it("returns PLATINUM for very high points", () => {
      expect(calculateTier(99999)).toBe(LOYALTY_TIER.PLATINUM)
    })
  })

  describe("LOYALTY_TIER_CONFIG", () => {
    it("has all 4 tiers defined", () => {
      expect(Object.keys(LOYALTY_TIER_CONFIG)).toHaveLength(4)
      expect(LOYALTY_TIER_CONFIG).toHaveProperty("BRONZE")
      expect(LOYALTY_TIER_CONFIG).toHaveProperty("SILVER")
      expect(LOYALTY_TIER_CONFIG).toHaveProperty("GOLD")
      expect(LOYALTY_TIER_CONFIG).toHaveProperty("PLATINUM")
    })

    it("has increasing thresholds", () => {
      const thresholds = Object.values(LOYALTY_TIER_CONFIG).map((c) => c.threshold)
      for (let i = 1; i < thresholds.length; i++) {
        expect(thresholds[i]).toBeGreaterThan(thresholds[i - 1])
      }
    })

    it("has increasing multipliers", () => {
      const multipliers = Object.values(LOYALTY_TIER_CONFIG).map((c) => c.multiplier)
      for (let i = 1; i < multipliers.length; i++) {
        expect(multipliers[i]).toBeGreaterThanOrEqual(multipliers[i - 1])
      }
    })

    it("BRONZE has nextTier SILVER", () => {
      expect(LOYALTY_TIER_CONFIG.BRONZE.nextTier).toBe("SILVER")
    })

    it("PLATINUM has no nextTier", () => {
      expect(LOYALTY_TIER_CONFIG.PLATINUM.nextTier).toBeNull()
    })
  })
})
