import type { Context, Next } from "hono";
import { logger } from "../lib/logger";

export async function auditLog(c: Context, next: Next) {
  const startTime = Date.now();
  const requestId = c.req.header("x-request-id") || crypto.randomUUID();
  c.set("requestId", requestId);

  // Log request
  logger.info("Request started", {
    requestId,
    method: c.req.method,
    path: c.req.path,
    ip: c.req.header("x-forwarded-for") || c.req.header("cf-connecting-ip"),
  });

  try {
    await next();

    const duration = Date.now() - startTime;
    const status = c.res.status;

    // Log security events
    if (status === 401 || status === 403) {
      logger.warn("Authentication/Authorization failure", {
        requestId,
        status,
        path: c.req.path,
      });
    }

    if (status === 429) {
      logger.warn("Rate limit hit", {
        requestId,
        path: c.req.path,
      });
    }

    logger.info("Request completed", {
      requestId,
      method: c.req.method,
      path: c.req.path,
      status,
      duration,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("Request failed", error, {
      requestId,
      method: c.req.method,
      path: c.req.path,
      duration,
    });
    throw error;
  }
}
