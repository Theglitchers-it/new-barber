import { describe, it, expect, vi, afterEach } from "vitest"
import { getCurrentSeason, getSeasonalConfig } from "@/lib/seasonal"

describe("Seasonal System", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("getCurrentSeason", () => {
    it("returns spring for March", () => {
      vi.setSystemTime(new Date(2026, 2, 15))
      expect(getCurrentSeason()).toBe("spring")
    })

    it("returns spring for May", () => {
      vi.setSystemTime(new Date(2026, 4, 1))
      expect(getCurrentSeason()).toBe("spring")
    })

    it("returns summer for June", () => {
      vi.setSystemTime(new Date(2026, 5, 21))
      expect(getCurrentSeason()).toBe("summer")
    })

    it("returns summer for August", () => {
      vi.setSystemTime(new Date(2026, 7, 15))
      expect(getCurrentSeason()).toBe("summer")
    })

    it("returns autumn for September", () => {
      vi.setSystemTime(new Date(2026, 8, 1))
      expect(getCurrentSeason()).toBe("autumn")
    })

    it("returns autumn for November", () => {
      vi.setSystemTime(new Date(2026, 10, 30))
      expect(getCurrentSeason()).toBe("autumn")
    })

    it("returns winter for December", () => {
      vi.setSystemTime(new Date(2026, 11, 25))
      expect(getCurrentSeason()).toBe("winter")
    })

    it("returns winter for January", () => {
      vi.setSystemTime(new Date(2026, 0, 15))
      expect(getCurrentSeason()).toBe("winter")
    })

    it("returns winter for February", () => {
      vi.setSystemTime(new Date(2026, 1, 14))
      expect(getCurrentSeason()).toBe("winter")
    })
  })

  describe("getSeasonalConfig", () => {
    it("returns a valid config with all required fields", () => {
      const config = getSeasonalConfig()
      expect(config).toHaveProperty("season")
      expect(config).toHaveProperty("label")
      expect(config).toHaveProperty("headline")
      expect(config).toHaveProperty("description")
      expect(config).toHaveProperty("icon")
      expect(config).toHaveProperty("gradient")
      expect(config).toHaveProperty("serviceKeywords")
      expect(config).toHaveProperty("productKeywords")
    })

    it("returns spring config in March", () => {
      vi.setSystemTime(new Date(2026, 2, 15))
      const config = getSeasonalConfig()
      expect(config.season).toBe("spring")
      expect(config.label).toBe("Primavera")
    })

    it("serviceKeywords is non-empty array", () => {
      const config = getSeasonalConfig()
      expect(Array.isArray(config.serviceKeywords)).toBe(true)
      expect(config.serviceKeywords.length).toBeGreaterThan(0)
    })
  })
})
