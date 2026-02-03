import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globalSetup: ["./globalTestSetup.ts"],
    projects: ['apps/*', 'packages/*'],
  }
})