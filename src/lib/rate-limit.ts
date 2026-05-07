import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextResponse, type NextRequest } from 'next/server'

// Shared Redis client (singleton)
function getRedis(): Redis {
  return new Redis({
    url:   process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  })
}

// ─── Preset limiters ──────────────────────────────────────────────────────────

/** General API endpoints: 100 requests per minute */
export const apiLimiter = new Ratelimit({
  redis:     getRedis(),
  limiter:   Ratelimit.slidingWindow(100, '1 m'),
  prefix:    'rl:api',
  analytics: false,
})

/** Auth endpoints (login/signup/otp): 10 requests per minute */
export const authLimiter = new Ratelimit({
  redis:     getRedis(),
  limiter:   Ratelimit.slidingWindow(10, '1 m'),
  prefix:    'rl:auth',
  analytics: false,
})

/** File upload endpoints: 20 requests per minute */
export const uploadLimiter = new Ratelimit({
  redis:     getRedis(),
  limiter:   Ratelimit.slidingWindow(20, '1 m'),
  prefix:    'rl:upload',
  analytics: false,
})

// ─── withRateLimit wrapper ────────────────────────────────────────────────────

type RateLimitHandler = (req: NextRequest) => Promise<NextResponse>

/**
 * Wrap a Next.js route handler with rate limiting.
 * Returns 429 with Retry-After header when the limit is breached.
 *
 * @example
 * export const POST = withRateLimit(authLimiter, async (req) => {
 *   // your handler
 * })
 */
export function withRateLimit(
  limiter: Ratelimit,
  handler: RateLimitHandler,
): RateLimitHandler {
  return async (req: NextRequest): Promise<NextResponse> => {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      'anonymous'

    const { success, reset } = await limiter.limit(ip)

    if (!success) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000)
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status:  429,
          headers: { 'Retry-After': String(retryAfter) },
        },
      )
    }

    return handler(req)
  }
}
