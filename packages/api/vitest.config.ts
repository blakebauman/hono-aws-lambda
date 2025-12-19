import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.{test,spec}.{js,ts}"],
    exclude: ["node_modules", "dist", ".idea", ".git", ".cache"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/**/*.d.ts",
        "src/**/*.config.ts",
        "src/**/index.ts",
        "**/*.test.ts",
        "**/*.spec.ts",
      ],
    },
    testTimeout: 10000,
    hookTimeout: 10000,
  },
});
