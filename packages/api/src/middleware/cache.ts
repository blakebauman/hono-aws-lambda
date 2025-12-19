// This file is kept for reference but Hono's built-in etag is now used in app.ts
// Custom cache control logic can be added here if needed

import type { Context, Next } from "hono";

export async function customCacheControl(c: Context, next: Next) {
  await next();

  // Set cache control headers if not already set
  if (!c.res.headers.get("Cache-Control")) {
    // Default: no cache for API endpoints
    // Override in routes that need caching
    c.header("Cache-Control", "no-store, no-cache, must-revalidate");
  }
}
