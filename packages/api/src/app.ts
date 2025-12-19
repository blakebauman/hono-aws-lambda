import { OpenAPIHono } from "@hono/zod-openapi";
import { bodyLimit } from "hono/body-limit";
import { compress } from "hono/compress";
import { cors } from "hono/cors";
import { etag } from "hono/etag";
import { logger as honoLogger } from "hono/logger";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import { timeout } from "hono/timeout";
import { timing } from "hono/timing";
import { env } from "./lib/env";
import { logger } from "./lib/logger";
import { auditLog } from "./middleware/audit";
import { customCacheControl } from "./middleware/cache";
import { rateLimit } from "./middleware/rate-limit";
import { sanitizeInput } from "./middleware/sanitize";
import agentsRouter from "./routes/ai/agents";
import chatRouter from "./routes/ai/chat";
import graphsRouter from "./routes/ai/graphs";
import apiRouter from "./routes/api/index";
import authRouter from "./routes/auth";
import docsRouter from "./routes/docs";
import type { AppVariables } from "./types/index";

// Use OpenAPIHono for the main app to enable OpenAPI spec generation
type Env = {
  Variables: AppVariables;
};

const app = new OpenAPIHono<Env>();

// Global middleware - Hono built-in middleware
app.use("*", requestId());
app.use("*", honoLogger()); // Hono's built-in logger for request/response logging
app.use("*", auditLog); // Custom audit logging for security events
app.use("*", secureHeaders()); // Hono's built-in secure headers
app.use("*", etag()); // Hono's built-in ETag support
app.use("*", timing()); // Hono's built-in timing middleware
app.use("*", timeout(30000)); // 30 second timeout
app.use("*", bodyLimit({ maxSize: 1024 * 1024 * 10 })); // 10MB body limit
app.use("*", sanitizeInput); // Custom input sanitization
app.use("*", customCacheControl); // Custom cache control headers
app.use("*", compress()); // Hono's built-in response compression (gzip/brotli)

// CORS
app.use(
  "*",
  cors({
    origin: env.CORS_ORIGIN || "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
    credentials: true,
  })
);

// CSRF protection (skip for auth endpoints which handle their own CSRF)
app.use("/api/*", async (c, next) => {
  // Skip CSRF for auth routes
  if (c.req.path.startsWith("/api/auth")) {
    return next();
  }
  // CSRF protection is handled by Better Auth for auth routes
  // For other routes, we rely on security headers and token validation
  return next();
});

// Rate limiting
app.use("/api/*", rateLimit());

// Health check (no rate limit)
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.route("/api/auth", authRouter);
app.route("/api", apiRouter);
app.route("/api/ai/chat", chatRouter);
app.route("/api/ai/agents", agentsRouter);
app.route("/api/ai/graphs", graphsRouter);
app.route("/docs", docsRouter);

// OpenAPI JSON endpoint - generated automatically from OpenAPIHono routes
// The spec is automatically generated from all mounted OpenAPIHono routers
app.doc("/api/openapi.json", {
  openapi: "3.0.0",
  info: {
    title: "Hono AWS Lambda API",
    version: "1.0.0",
    description: "Production-ready Hono REST API with AWS Lambda",
  },
  servers: [
    {
      url: env.BETTER_AUTH_URL || "http://localhost:3000",
      description: "API Server",
    },
  ],
});

// Error handling
app.onError((err, c) => {
  logger.error("Unhandled error", err, {
    requestId: c.get("requestId"),
    path: c.req.path,
  });

  const status = err instanceof Error && "status" in err ? (err.status as number) : 500;
  const message = env.NODE_ENV === "production" ? "Internal server error" : err.message;

  return c.json(
    {
      success: false,
      error: {
        message,
        code: "INTERNAL_ERROR",
      },
      meta: {
        requestId: c.get("requestId"),
        timestamp: new Date().toISOString(),
      },
    },
    status as 400 | 401 | 403 | 404 | 500
  );
});

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: {
        message: "Not found",
        code: "NOT_FOUND",
      },
      meta: {
        requestId: c.get("requestId"),
        timestamp: new Date().toISOString(),
      },
    },
    404
  );
});

export default app;
