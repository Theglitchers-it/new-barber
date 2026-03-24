import { describe, it, expect } from "vitest"
import { proxyImageUrl } from "@/lib/image-url"

describe("proxyImageUrl", () => {
  it("returns null for null input", () => {
    expect(proxyImageUrl(null)).toBeNull()
  })

  it("proxies Unsplash URLs", () => {
    const url = "https://images.unsplash.com/photo-123?w=400"
    const result = proxyImageUrl(url)
    expect(result).toBe(`/api/image-proxy?url=${encodeURIComponent(url)}`)
  })

  it("does not proxy non-Unsplash URLs", () => {
    const url = "https://example.com/image.jpg"
    expect(proxyImageUrl(url)).toBe(url)
  })

  it("does not proxy relative URLs", () => {
    const url = "/images/logo.png"
    expect(proxyImageUrl(url)).toBe(url)
  })

  it("does not proxy similar but different domains", () => {
    const url = "https://images.unsplash.com.evil.com/photo"
    expect(proxyImageUrl(url)).toBe(url)
  })

  it("proxies Unsplash URLs with complex query strings", () => {
    const url = "https://images.unsplash.com/photo-123?w=600&h=400&fit=crop&crop=face"
    const result = proxyImageUrl(url)
    expect(result).toContain("/api/image-proxy?url=")
    expect(result).toContain(encodeURIComponent(url))
  })
})
