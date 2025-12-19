import { describe, expect, it, vi } from "vitest";
import apiRouter from "./index";

// Mock environment variables for testing
vi.mock("../lib/env", () => ({
  env: {
    NODE_ENV: "test",
    DATABASE_URL: "postgresql://test:test@localhost:5432/test",
    BETTER_AUTH_SECRET: "test-secret-key-minimum-32-characters-long",
    BETTER_AUTH_URL: "http://localhost:3000",
  },
}));

describe("API Routes", () => {
  it("should return health check response", async () => {
    const res = await apiRouter.request("/health");
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json).toHaveProperty("status");
    expect(json).toHaveProperty("timestamp");
  });

  it("should create example with valid data", async () => {
    const res = await apiRouter.request("/example", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Test Example",
        description: "Test description",
      }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("success");
    expect(json.success).toBe(true);
    expect(json.data).toHaveProperty("id");
    expect(json.data.name).toBe("Test Example");
  });

  it("should reject invalid example data", async () => {
    const res = await apiRouter.request("/example", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "", // Invalid: empty string
      }),
    });

    expect(res.status).toBe(400);
  });
});
