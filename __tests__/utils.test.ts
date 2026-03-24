import { describe, it, expect } from "vitest"
import { cn } from "@/lib/utils"

describe("cn utility", () => {
  it("merges class names", () => {
    expect(cn("text-sm", "font-bold")).toBe("text-sm font-bold")
  })

  it("handles conditional classes", () => {
    expect(cn("base", true && "active", false && "inactive")).toBe("base active")
  })

  it("deduplicates tailwind classes", () => {
    // twMerge should keep the last conflicting class
    expect(cn("text-sm", "text-lg")).toBe("text-lg")
  })

  it("handles undefined and null", () => {
    expect(cn("base", undefined, null, "extra")).toBe("base extra")
  })

  it("handles empty input", () => {
    expect(cn()).toBe("")
  })
})
