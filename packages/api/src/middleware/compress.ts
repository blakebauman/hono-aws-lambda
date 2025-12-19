// Compression middleware - using Hono's built-in compress
import { compress } from "hono/compress";

export { compress as compression };

// Hono's compress middleware handles gzip/brotli compression automatically
// It's already imported and used in app.ts
