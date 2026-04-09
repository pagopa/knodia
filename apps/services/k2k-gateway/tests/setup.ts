import type { FastifyInstance } from "fastify";

import { pollingServiceBuilder } from "@knodia/polling";
import { beforeAll } from "vitest";

import { buildApp } from "../src/app.ts";

export let app: FastifyInstance;

beforeAll(async () => {
  app = buildApp({
    agreementProcessUrl: "http://localhost:0",
    callerKnodeId: "Lynx",
    eserviceProcessUrl: "http://localhost:0",
    internalJwt: {
      audience: "test-audience",
      issuer: "test-issuer",
      kid: "test-kid",
      secondsDuration: 3600,
      subject: "test-subject",
    },
    keychainProcessUrl: "http://localhost:0",
    loggerConfig: { logLevel: "silent" },
    organizationProcessUrl: "http://localhost:0",
    pollingService: pollingServiceBuilder({
      maxPollingAttempts: 1,
      pollingDelayMs: 0,
    }),
    purposeProcessUrl: "http://localhost:0",
  });
});
