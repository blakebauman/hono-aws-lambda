import { describe, expect, it } from "vitest";
import app from "./app";

// Mock environment variables for testing
vi.mock("./lib/env", () => ({
  env: {
    NODE_ENV: "test",
    DATABASE_URL: "postgresql://test:test@localhost:5432/test",
    BETTER_AUTH_SECRET: "test-secret-key-minimum-32-characters-long",
    BETTER_AUTH_URL: "http://localhost:3000",
    CORS_ORIGIN: "http://localhost:3000",
  },
}));

// Mock logger to avoid console output during tests
vi.mock("./lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe("App", () => {
  it("should return 200 for health check", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json).toHaveProperty("status");
    expect(json.status).toBe("ok");
    expect(json).toHaveProperty("timestamp");
  });

  it("should return 404 for unknown routes", async () => {
    const res = await app.request("/unknown-route");
    expect(res.status).toBe(404);

    const json = await res.json();
    expect(json).toHaveProperty("success");
    expect(json.success).toBe(false);
    expect(json).toHaveProperty("error");
  });

  it("should have OpenAPI documentation endpoint", async () => {
    const res = await app.request("/api/openapi.json");
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json).toHaveProperty("openapi");
    expect(json).toHaveProperty("info");
    expect(json.info.title).toBe("Hono AWS Lambda API");
  });
});
