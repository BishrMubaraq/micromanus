/**
 * Lightweight in-memory rate limiter for API routes.
 * Suitable for single-instance / edge-adjacent deploys.
 * Swap the store for Redis/Upstash when scaling horizontally.
 */

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const store = new Map<string, Bucket>();

function pruneExpired(now: number) {
  if (store.size < 2_000) return;
  for (const [key, bucket] of store) {
    if (bucket.resetAt <= now) store.delete(key);
  }
}

export function rateLimit(input: {
  key: string;
  limit: number;
  windowMs: number;
}): RateLimitResult {
  const now = Date.now();
  pruneExpired(now);

  const existing = store.get(input.key);
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + input.windowMs;
    store.set(input.key, { count: 1, resetAt });
    return {
      success: true,
      limit: input.limit,
      remaining: input.limit - 1,
      resetAt,
    };
  }

  if (existing.count >= input.limit) {
    return {
      success: false,
      limit: input.limit,
      remaining: 0,
      resetAt: existing.resetAt,
    };
  }

  existing.count += 1;
  return {
    success: true,
    limit: input.limit,
    remaining: Math.max(0, input.limit - existing.count),
    resetAt: existing.resetAt,
  };
}

export function rateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
    ...(result.success
      ? {}
      : {
          "Retry-After": String(
            Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000)),
          ),
        }),
  };
}

/** Convenience presets used by MicroManus APIs. */
export const RATE_LIMITS = {
  chat: { limit: 20, windowMs: 60_000 },
  pdf: { limit: 30, windowMs: 60_000 },
  auth: { limit: 12, windowMs: 60_000 },
} as const;

export function enforceRateLimit(input: {
  key: string;
  limit: number;
  windowMs: number;
}): Response | null {
  const result = rateLimit(input);
  if (result.success) return null;

  return new Response("Too many requests. Please slow down.", {
    status: 429,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      ...rateLimitHeaders(result),
    },
  });
}
