import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "staging", "production"]).default("development"),
  DATABASE_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
  AWS_REGION: z.string().default("us-east-1"),
  AWS_ACCOUNT_ID: z.string().optional(),
  REDIS_URL: z.string().url().optional(),
  CORS_ORIGIN: z.string().url().optional(),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
  CSRF_SECRET: z.string().min(32).optional(),
  SESSION_SECRET: z.string().min(32).optional(),
  LANGCHAIN_API_KEY: z.string().optional(),
  LANGSMITH_API_KEY: z.string().optional(),
  LANGSMITH_PROJECT: z.string().default("dev"),
  LANGSMITH_TRACING: z.coerce.boolean().default(true),
  LANGSMITH_ENDPOINT: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("❌ Invalid environment variables:");
    console.error(parsed.error.format());
    throw new Error("Invalid environment variables");
  }

  return parsed.data;
}

export const env = validateEnv();
