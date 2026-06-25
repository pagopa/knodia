import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    tanstackRouter({
      disableLogging: true,
    }),
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    css: false,
    environment: "jsdom",
    globals: false,
    include: ["src/**/*.test.{ts,tsx}"],
    name: "@knodia/signup-frontend",
    setupFiles: ["./src/test/setup.ts"],
  },
});
