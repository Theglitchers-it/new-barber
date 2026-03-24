import { describe, it, expect } from "vitest"
import { addToCartSchema, updateCartSchema } from "@/lib/validations/cart"

describe("Cart Validation Schemas", () => {
  describe("addToCartSchema", () => {
    it("accepts valid add to cart", () => {
      const result = addToCartSchema.safeParse({ productId: "prod-123", quantity: 2 })
      expect(result.success).toBe(true)
    })

    it("defaults quantity to 1", () => {
      const result = addToCartSchema.safeParse({ productId: "prod-123" })
      expect(result.success).toBe(true)
      if (result.success) expect(result.data.quantity).toBe(1)
    })

    it("rejects empty productId", () => {
      const result = addToCartSchema.safeParse({ productId: "", quantity: 1 })
      expect(result.success).toBe(false)
    })

    it("rejects quantity 0", () => {
      const result = addToCartSchema.safeParse({ productId: "prod-123", quantity: 0 })
      expect(result.success).toBe(false)
    })

    it("rejects negative quantity", () => {
      const result = addToCartSchema.safeParse({ productId: "prod-123", quantity: -1 })
      expect(result.success).toBe(false)
    })

    it("rejects non-integer quantity", () => {
      const result = addToCartSchema.safeParse({ productId: "prod-123", quantity: 1.5 })
      expect(result.success).toBe(false)
    })
  })

  describe("updateCartSchema", () => {
    it("accepts valid quantity", () => {
      const result = updateCartSchema.safeParse({ quantity: 3 })
      expect(result.success).toBe(true)
    })

    it("rejects quantity 0", () => {
      const result = updateCartSchema.safeParse({ quantity: 0 })
      expect(result.success).toBe(false)
    })
  })
})
