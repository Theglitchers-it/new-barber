import { describe, it, expect, vi, afterEach } from "vitest"

// We need to test the rate limiter logic directly
// Since the module exports pre-created limiters, we test via loginLimiter
import { loginLimiter, getRateLimitResponse } from "@/lib/rate-limit"

describe("Rate Limiter", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("allows first request", () => {
    const result = loginLimiter.check(5, "test-unique-token-1")
    expect(result.success).toBe(true)
    expect(result.remaining).toBe(4)
  })

  it("decrements remaining on subsequent requests", () => {
    const token = "test-decrement-token"
    loginLimiter.check(5, token)
    const result2 = loginLimiter.check(5, token)
    expect(result2.success).toBe(true)
    expect(result2.remaining).toBe(3)
  })

  it("blocks after limit exceeded", () => {
    const token = "test-block-token"
    for (let i = 0; i < 5; i++) {
      loginLimiter.check(5, token)
    }
    const result = loginLimiter.check(5, token)
    expect(result.success).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it("different tokens have independent limits", () => {
    const token1 = "test-independent-1"
    const token2 = "test-independent-2"
    // Exhaust token1
    for (let i = 0; i < 5; i++) loginLimiter.check(5, token1)
    expect(loginLimiter.check(5, token1).success).toBe(false)
    // token2 should still work
    expect(loginLimiter.check(5, token2).success).toBe(true)
  })

  describe("getRateLimitResponse", () => {
    it("returns 429 status", async () => {
      const response = getRateLimitResponse()
      expect(response.status).toBe(429)
    })

    it("returns Retry-After header", () => {
      const response = getRateLimitResponse()
      expect(response.headers.get("Retry-After")).toBe("60")
    })

    it("returns JSON error message", async () => {
      const response = getRateLimitResponse()
      const body = await response.json()
      expect(body.error).toBeDefined()
      expect(typeof body.error).toBe("string")
    })
  })
})
