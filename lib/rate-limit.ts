type RateLimitEntry = { count: number; resetTime: number }

function createRateLimiter(options: { interval: number; maxTokens: number }) {
  const cache = new Map<string, RateLimitEntry>()

  return {
    check(limit: number, token: string): { success: boolean; remaining: number } {
      const now = Date.now()
      const entry = cache.get(token)

      if (!entry || now > entry.resetTime) {
        // Prune expired entries if cache is large
        if (cache.size >= options.maxTokens) {
          for (const [key, val] of cache) {
            if (now > val.resetTime) cache.delete(key)
          }
        }
        cache.set(token, { count: 1, resetTime: now + options.interval })
        return { success: true, remaining: limit - 1 }
      }

      entry.count++
      if (entry.count > limit) {
        return { success: false, remaining: 0 }
      }
      return { success: true, remaining: limit - entry.count }
    },
  }
}

// 5 tentativi per 60 secondi per email
export const loginLimiter = createRateLimiter({ interval: 60_000, maxTokens: 500 })

// 3 tentativi per 60 secondi per IP
export const registerLimiter = createRateLimiter({ interval: 60_000, maxTokens: 500 })

// 3 tentativi per 60 secondi per userId
export const passwordChangeLimiter = createRateLimiter({ interval: 60_000, maxTokens: 500 })

// 5 recensioni per 60 secondi per userId
export const reviewLimiter = createRateLimiter({ interval: 60_000, maxTokens: 500 })

// 5 cancellazioni per 60 secondi per userId
export const cancelLimiter = createRateLimiter({ interval: 60_000, maxTokens: 500 })

// 3 riscatti per 60 secondi per userId
export const redeemLimiter = createRateLimiter({ interval: 60_000, maxTokens: 500 })

// 10 prenotazioni per 60 secondi per userId
export const appointmentLimiter = createRateLimiter({ interval: 60_000, maxTokens: 500 })

// 5 ordini per 60 secondi per userId
export const orderLimiter = createRateLimiter({ interval: 60_000, maxTokens: 500 })

// 20 richieste per 60 secondi per IP (image proxy)
export const proxyLimiter = createRateLimiter({ interval: 60_000, maxTokens: 1000 })

export function getRateLimitResponse() {
  return new Response(
    JSON.stringify({ error: "Troppi tentativi. Riprova tra un minuto." }),
    { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "60" } }
  )
}
