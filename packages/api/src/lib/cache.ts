import Redis from "ioredis";
import { env } from "./env";
import { logger } from "./logger";

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (redis) {
    return redis;
  }

  if (!env.REDIS_URL) {
    throw new Error("REDIS_URL is not configured");
  }

  redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    reconnectOnError(err) {
      const targetError = "READONLY";
      if (err.message.includes(targetError)) {
        return true;
      }
      return false;
    },
  });

  redis.on("error", (error) => {
    logger.error("Redis connection error", error);
  });

  redis.on("connect", () => {
    logger.info("Redis connected");
  });

  return redis;
}

export async function closeRedis() {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}

// Cache helper functions
export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const client = getRedis();
    const value = await client.get(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  } catch (error) {
    logger.error("Cache get error", error, { key });
    return null;
  }
}

export async function setCached(key: string, value: unknown, ttlSeconds = 3600): Promise<void> {
  try {
    const client = getRedis();
    await client.setex(key, ttlSeconds, JSON.stringify(value));
  } catch (error) {
    logger.error("Cache set error", error, { key });
  }
}

export async function deleteCached(key: string): Promise<void> {
  try {
    const client = getRedis();
    await client.del(key);
  } catch (error) {
    logger.error("Cache delete error", error, { key });
  }
}
