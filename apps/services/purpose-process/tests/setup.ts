import { afterAll, beforeAll } from "vitest";

import { buildApp } from "../src/app.ts";

let app: ReturnType<typeof buildApp>;

beforeAll(async () => {
  app = buildApp({
    config: {
      acceptedAudiences: ["test-audience"],
      isProduction: false,
      logLevel: "silent",
      nodeEnv: "test",
      wellKnownUrls: ["https://test.example.com/.well-known/jwks.json"],
    },
  });
});

afterAll(async () => {
  await app.close();
});

export { app };
