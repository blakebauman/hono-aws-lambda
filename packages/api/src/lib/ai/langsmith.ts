import { Client } from "langsmith";
import { env } from "../env";
import { logger } from "../logger";

let client: Client | null = null;

export function getLangSmithClient(): Client | null {
  if (!env.LANGSMITH_API_KEY || !env.LANGSMITH_TRACING) {
    return null;
  }

  if (client) {
    return client;
  }

  try {
    client = new Client({
      apiKey: env.LANGSMITH_API_KEY,
      apiUrl: process.env.LANGSMITH_ENDPOINT,
    });
    logger.info("LangSmith client initialized", { project: env.LANGSMITH_PROJECT });
    return client;
  } catch (error) {
    logger.error("Failed to initialize LangSmith client", error);
    return null;
  }
}

export function getLangSmithConfig() {
  if (!env.LANGSMITH_API_KEY || !env.LANGSMITH_TRACING) {
    return undefined;
  }

  return {
    apiKey: env.LANGSMITH_API_KEY,
    projectName: env.LANGSMITH_PROJECT,
    apiUrl: env.LANGSMITH_ENDPOINT,
  };
}

// Set up LangSmith tracing environment variables
export function setupLangSmithTracing() {
  if (!env.LANGSMITH_API_KEY || !env.LANGSMITH_TRACING) {
    return;
  }

  process.env.LANGCHAIN_TRACING_V2 = "true";
  process.env.LANGCHAIN_API_KEY = env.LANGSMITH_API_KEY;
  process.env.LANGCHAIN_PROJECT = env.LANGSMITH_PROJECT;

  if (env.LANGSMITH_ENDPOINT) {
    process.env.LANGCHAIN_ENDPOINT = env.LANGSMITH_ENDPOINT;
  }

  logger.info("LangSmith tracing configured", {
    project: env.LANGSMITH_PROJECT,
  });
}
