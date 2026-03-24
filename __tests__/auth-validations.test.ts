import { describe, it, expect } from "vitest"
import {
  loginSchema,
  registerSchema,
  profileUpdateSchema,
  passwordChangeSchema,
  PASSWORD_MIN_LENGTH,
} from "@/lib/validations/auth"

describe("Auth Validation Schemas", () => {
  describe("loginSchema", () => {
    it("accepts valid login", () => {
      const result = loginSchema.safeParse({ email: "test@email.it", password: "password123" })
      expect(result.success).toBe(true)
    })

    it("rejects invalid email", () => {
      const result = loginSchema.safeParse({ email: "not-an-email", password: "password123" })
      expect(result.success).toBe(false)
    })

    it("rejects empty password", () => {
      const result = loginSchema.safeParse({ email: "test@email.it", password: "" })
      expect(result.success).toBe(false)
    })

    it("rejects missing email", () => {
      const result = loginSchema.safeParse({ password: "password123" })
      expect(result.success).toBe(false)
    })
  })

  describe("registerSchema", () => {
    const validData = {
      name: "Mario Rossi",
      email: "mario@email.it",
      password: "Password1",
      confirmPassword: "Password1",
    }

    it("accepts valid registration", () => {
      const result = registerSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it("rejects name < 2 chars", () => {
      const result = registerSchema.safeParse({ ...validData, name: "M" })
      expect(result.success).toBe(false)
    })

    it("rejects password without uppercase", () => {
      const result = registerSchema.safeParse({ ...validData, password: "password1", confirmPassword: "password1" })
      expect(result.success).toBe(false)
    })

    it("rejects password without lowercase", () => {
      const result = registerSchema.safeParse({ ...validData, password: "PASSWORD1", confirmPassword: "PASSWORD1" })
      expect(result.success).toBe(false)
    })

    it("rejects password without number", () => {
      const result = registerSchema.safeParse({ ...validData, password: "Passwordd", confirmPassword: "Passwordd" })
      expect(result.success).toBe(false)
    })

    it("rejects password shorter than minimum", () => {
      const short = "Pa1" + "x".repeat(PASSWORD_MIN_LENGTH - 4)
      const result = registerSchema.safeParse({ ...validData, password: short, confirmPassword: short })
      expect(result.success).toBe(false)
    })

    it("rejects mismatched passwords", () => {
      const result = registerSchema.safeParse({ ...validData, confirmPassword: "Different1" })
      expect(result.success).toBe(false)
    })

    it("accepts optional phone", () => {
      const result = registerSchema.safeParse({ ...validData, phone: "+39 340 1234567" })
      expect(result.success).toBe(true)
    })
  })

  describe("profileUpdateSchema", () => {
    it("accepts partial update", () => {
      const result = profileUpdateSchema.safeParse({ name: "Nuovo Nome" })
      expect(result.success).toBe(true)
    })

    it("accepts empty object", () => {
      const result = profileUpdateSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it("rejects name < 2 chars", () => {
      const result = profileUpdateSchema.safeParse({ name: "X" })
      expect(result.success).toBe(false)
    })

    it("rejects notes > 500 chars", () => {
      const result = profileUpdateSchema.safeParse({ notes: "x".repeat(501) })
      expect(result.success).toBe(false)
    })
  })

  describe("passwordChangeSchema", () => {
    it("accepts valid password change", () => {
      const result = passwordChangeSchema.safeParse({
        currentPassword: "oldpassword",
        newPassword: "NewPass1",
      })
      expect(result.success).toBe(true)
    })

    it("rejects empty current password", () => {
      const result = passwordChangeSchema.safeParse({
        currentPassword: "",
        newPassword: "NewPass1",
      })
      expect(result.success).toBe(false)
    })

    it("rejects weak new password", () => {
      const result = passwordChangeSchema.safeParse({
        currentPassword: "oldpassword",
        newPassword: "weak",
      })
      expect(result.success).toBe(false)
    })
  })
})
