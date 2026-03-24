/**
 * Wraps external image URLs through a local proxy to avoid CSP/sandbox issues.
 * Only proxies images.unsplash.com; returns other URLs unchanged.
 */
export function proxyImageUrl(url: string | null): string | null {
  if (!url) return null
  try {
    const parsed = new URL(url)
    if (parsed.hostname === "images.unsplash.com") {
      return `/api/image-proxy?url=${encodeURIComponent(url)}`
    }
  } catch {
    // Not a valid URL, return as-is
  }
  return url
}
