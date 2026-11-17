import type { H3Event } from 'h3'

interface RateBucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, RateBucket>()
const MAX_BUCKETS = 5000

function consume(key: string, limit: number, windowMs: number) {
  const now = Date.now()

  if (buckets.size > MAX_BUCKETS) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(bucketKey)
    }
  }

  const current = buckets.get(key)

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, retryAfterSeconds: 0 }
  }

  current.count += 1

  if (current.count > limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000))
    }
  }

  return { allowed: true, retryAfterSeconds: 0 }
}

export function assertRateLimit(event: H3Event, scope: string, limit: number, windowMs: number) {
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  const result = consume(`${scope}:${ip}`, limit, windowMs)

  if (!result.allowed) {
    setResponseHeader(event, 'Retry-After', result.retryAfterSeconds)
    throw createError({
      statusCode: 429,
      statusMessage: 'Too many requests',
      message: 'Too many attempts. Please try again later.'
    })
  }
}
