import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    fileParallelism: false,
    globalSetup: ["./globalTestSetup.ts"],
    projects: ['apps/services/*'],
  }
})