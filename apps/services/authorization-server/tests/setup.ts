import { afterAll, beforeAll } from "vitest";

import { buildApp } from "../src/app.ts";

const app = buildApp({
  config: {
    isProduction: false,
    logLevel: "silent",
    nodeEnv: "test",
  },
});

beforeAll(async () => {
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

export { app };
