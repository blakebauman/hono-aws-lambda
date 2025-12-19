import type { Context, Next } from "hono";
import { getRedis } from "../lib/cache";
import { env } from "../lib/env";
import { logger } from "../lib/logger";

interface RateLimitOptions {
  windowMs?: number;
  maxRequests?: number;
  keyGenerator?: (c: Context) => string;
}

export function rateLimit(options: RateLimitOptions = {}) {
  const windowMs = options.windowMs ?? env.RATE_LIMIT_WINDOW_MS;
  const maxRequests = options.maxRequests ?? env.RATE_LIMIT_MAX_REQUESTS;

  return async (c: Context, next: Next) => {
    try {
      const key = options.keyGenerator
        ? options.keyGenerator(c)
        : `rate_limit:${c.req.header("x-forwarded-for") || c.req.header("cf-connecting-ip") || "unknown"}`;

      const redis = getRedis();
      const current = await redis.incr(key);

      if (current === 1) {
        await redis.expire(key, Math.ceil(windowMs / 1000));
      }

      const remaining = Math.max(0, maxRequests - current);
      const reset = await redis.ttl(key);

      c.header("X-RateLimit-Limit", String(maxRequests));
      c.header("X-RateLimit-Remaining", String(remaining));
      c.header("X-RateLimit-Reset", String(reset));

      if (current > maxRequests) {
        logger.warn("Rate limit exceeded", { key, current, maxRequests });
        return c.json({ error: "Rate limit exceeded" }, 429);
      }

      await next();
    } catch (error) {
      logger.error("Rate limit middleware error", error);
      // Fail open - allow request if rate limiting fails
      await next();
    }
  };
}
