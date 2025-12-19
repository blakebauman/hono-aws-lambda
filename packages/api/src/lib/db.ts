import * as schema from "@hono-aws-lambda/shared/db";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "./env";

// Connection pool for Lambda
let connection: ReturnType<typeof postgres> | null = null;
let db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (db) {
    return db;
  }

  if (!connection) {
    connection = postgres(env.DATABASE_URL, {
      max: 10, // Connection pool size
      idle_timeout: 20,
      connect_timeout: 10,
    });
  }

  db = drizzle(connection, { schema });
  return db;
}

// Close connection (useful for cleanup)
export async function closeDb() {
  if (connection) {
    await connection.end();
    connection = null;
    db = null;
  }
}
