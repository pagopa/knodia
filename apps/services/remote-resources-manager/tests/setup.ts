import { beforeAll } from "vitest";

import { buildApp } from "../src/app.ts";

let app: ReturnType<typeof buildApp>;

beforeAll(() => {
  app = buildApp({
    config: {
      acceptedAudiences: ["test-audience"],
      isProduction: false,
      logLevel: "silent",
      nodeEnv: "test",
      wellKnownUrls: ["https://test.example.com/.well-known/jwks.json"],
    },
    knodeUrl: "http://localhost:0",
  });
});

export { app };
