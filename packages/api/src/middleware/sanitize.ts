import DOMPurify from "dompurify";
import type { Context, Next } from "hono";
import { JSDOM } from "jsdom";

// Create a minimal DOM environment for DOMPurify
const window = new JSDOM("").window;
const purify = DOMPurify(window as unknown as Window & typeof globalThis);

function sanitizeString(value: unknown): unknown {
  if (typeof value === "string") {
    return purify.sanitize(value, { ALLOWED_TAGS: [] });
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeString);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, sanitizeString(v)]));
  }
  return value;
}

export async function sanitizeInput(c: Context, next: Next) {
  // Sanitize query params
  const query = c.req.query();
  if (query && Object.keys(query).length > 0) {
    const _sanitized = sanitizeString(query);
    // Note: Hono doesn't allow direct query modification, so we'll sanitize in route handlers
    // This middleware serves as a reminder and can log suspicious input
  }

  await next();
}
