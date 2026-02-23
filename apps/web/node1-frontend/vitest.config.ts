import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    css: false,
    env: {
      BFF_URL: "http://localhost:3000/bff",
    },
    environment: "jsdom",
    globals: false,
    include: ["src/**/*.test.{ts,tsx}"],
    name: "@knodia/node1-frontend",
    setupFiles: ["./src/test/setup.ts"],
  },
});
