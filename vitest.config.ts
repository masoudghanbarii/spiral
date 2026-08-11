import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: ["src/**/*.ts"],
      exclude: [
        "src/cli.ts",
        "src/index.ts",
        "src/types.ts",
        "src/tui/types.ts",
        "src/tui/constants.ts",
        "src/tui/index.ts",
        "src/tui/components/**",
        "src/tui/app.tsx",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
});