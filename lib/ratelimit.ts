import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Vercel's Upstash Redis integration automatically injects these env vars when
// you add the integration in the Vercel dashboard (Settings → Integrations →
// search "Upstash Redis"). Pull them locally with: `vercel env pull .env.local`
//
// Rate limiters are only instantiated when the env vars are present.
// In local development without KV configured, both values stay null and callers
// gracefully skip rate limiting instead of throwing.
const isRedisConfigured = !!(
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
);

const redis = isRedisConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// 20 requests / minute per IP — generous for a chat interface
export const assistantLimiter: Ratelimit | null =
  redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(20, "1 m"),
        prefix: "rl:assistant",
      })
    : null;

// 5 requests / minute per IP — outfit generation is a heavier AI call
export const outfitLimiter: Ratelimit | null =
  redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "1 m"),
        prefix: "rl:outfit",
      })
    : null;

/**
 * Extract the real client IP from standard proxy headers.
 * Vercel injects the true client IP as the first value in x-forwarded-for.
 */
export function getIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "127.0.0.1";
}
