import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@login-bg.webp": path.resolve(
        __dirname,
        "./src/assets/login-bg-orion.webp",
      ),
      "@theme.css": path.resolve(
        __dirname,
        "../../../packages/ui-kit/src/themes/orion.css",
      ),
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
    name: "@knodia/knode-frontend",
    setupFiles: ["./src/test/setup.ts"],
  },
});
