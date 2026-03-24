import { NextRequest, NextResponse } from "next/server"
import { proxyLimiter, getRateLimitResponse } from "@/lib/rate-limit"

const ALLOWED_HOSTS = ["images.unsplash.com"]

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous"
  const { success } = proxyLimiter.check(20, ip)
  if (!success) return getRateLimitResponse()

  const url = request.nextUrl.searchParams.get("url")
  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 })
  }

  try {
    const parsed = new URL(url)
    if (parsed.protocol !== "https:") {
      return NextResponse.json({ error: "Only HTTPS URLs allowed" }, { status: 400 })
    }
    if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
      return NextResponse.json({ error: "Host not allowed" }, { status: 403 })
    }

    const res = await fetch(url)
    if (!res.ok) {
      return NextResponse.json({ error: "Upstream error" }, { status: res.status })
    }

    const contentType = res.headers.get("content-type") || "image/jpeg"
    if (!contentType.startsWith("image/")) {
      return NextResponse.json({ error: "Invalid content type" }, { status: 400 })
    }

    const buffer = await res.arrayBuffer()
    // Limit response size to 10MB
    if (buffer.byteLength > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Image too large" }, { status: 413 })
    }

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch {
    return NextResponse.json({ error: "Failed to fetch image" }, { status: 500 })
  }
}
