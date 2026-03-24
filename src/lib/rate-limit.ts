/**
 * Simple in-memory rate limiter.
 * Works for single-instance deployments (dev, small VPS).
 * For Vercel/serverless at scale, swap the store for Vercel KV or Upstash Redis.
 */

interface Entry {
    count: number;
    resetAt: number;
}

// Module-level store — persists across requests in the same process
const store = new Map<string, Entry>();

// Periodically prune expired entries to prevent unbounded growth
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
        if (now > entry.resetAt) store.delete(key);
    }
}, 60_000);

interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: number;
}

/**
 * Check if a request is within the rate limit.
 * @param key     Unique identifier (e.g. `device:${deviceId}`, `ip:${ip}`)
 * @param max     Max requests allowed per window
 * @param windowMs  Window duration in milliseconds
 */
export function checkRateLimit(key: string, max: number, windowMs: number): RateLimitResult {
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || now > entry.resetAt) {
        const newEntry: Entry = { count: 1, resetAt: now + windowMs };
        store.set(key, newEntry);
        return { allowed: true, remaining: max - 1, resetAt: newEntry.resetAt };
    }

    if (entry.count >= max) {
        return { allowed: false, remaining: 0, resetAt: entry.resetAt };
    }

    entry.count++;
    return { allowed: true, remaining: max - entry.count, resetAt: entry.resetAt };
}

/** Returns a 429 NextResponse with Retry-After header. */
export function rateLimitResponse(resetAt: number) {
    const retryAfterSecs = Math.ceil((resetAt - Date.now()) / 1000);
    return new Response(
        JSON.stringify({ error: "Too many requests. Please slow down." }),
        {
            status: 429,
            headers: {
                "Content-Type": "application/json",
                "Retry-After": String(retryAfterSecs),
                "X-RateLimit-Reset": String(Math.floor(resetAt / 1000)),
            },
        }
    );
}
