import { afterAll, beforeAll } from "vitest";

import { buildApp } from "../src/app.ts";

const app = buildApp({
  config: {
    isProduction: false,
    logLevel: "silent",
    nodeEnv: "test",
  },
  knodeUrl: "http://localhost:0",
});

beforeAll(async () => {
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

export { app };
