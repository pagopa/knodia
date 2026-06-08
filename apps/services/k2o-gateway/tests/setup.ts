import type { FastifyInstance } from "fastify";

import { afterAll, beforeAll } from "vitest";

import { buildApp } from "../src/app.ts";

export let app: FastifyInstance;

beforeAll(async () => {
  app = buildApp({
    config: {
      acceptedAudiences: ["test-audience"],
      isProduction: false,
      logLevel: "silent",
      nodeEnv: "test",
      wellKnownUrls: ["https://test.example.com/.well-known/jwks.json"],
    },
    internalJwt: {
      audience: "test-audience",
      issuer: "test-issuer",
      kid: "test-kid",
      secondsDuration: 3600,
      subject: "test-subject",
    },
    keychainProcessUrl: "http://localhost:0",
  });

  await app.ready();
});

afterAll(async () => {
  await app.close();
});
