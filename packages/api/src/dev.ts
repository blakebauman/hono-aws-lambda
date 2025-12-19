import { serve } from "@hono/node-server";
import app from "./app";
import { setupLangSmithTracing } from "./lib/ai/langsmith";
import { env } from "./lib/env";
import { logger } from "./lib/logger";

// Setup LangSmith tracing
setupLangSmithTracing();

const port = Number(process.env.PORT) || 3000;

logger.info("Starting development server", { port, env: env.NODE_ENV });

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    logger.info(`Server is running on http://localhost:${info.port}`);
  }
);
