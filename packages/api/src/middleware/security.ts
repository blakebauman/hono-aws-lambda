// This file is kept for reference but Hono's built-in secureHeaders is now used
// Custom security headers can be added here if needed beyond Hono's defaults

import type { Context, Next } from "hono";
import { env } from "../lib/env";

// Additional custom security headers if needed
export async function customSecurityHeaders(c: Context, next: Next) {
  await next();

  // Add any custom security headers beyond Hono's secureHeaders defaults
  if (env.NODE_ENV === "production") {
    // Hono's secureHeaders already includes most headers, but we can add custom ones
    c.header("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  }
}
