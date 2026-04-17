import type { FastifyInstance } from "fastify";

import { pollingServiceBuilder } from "@knodia/polling";
import { beforeAll } from "vitest";

import { buildApp } from "../src/app.ts";

export let app: FastifyInstance;

beforeAll(async () => {
  app = buildApp({
    agreementProcessUrl: "http://localhost:0",
    callerKnodeId: "Lynx",
    eserviceInterfacesS3Bucket: "test-bucket",
    eserviceProcessUrl: "http://localhost:0",
    externalUiSessionMagicLinkJwt: {
      audience: "test-magic-link-audience",
      issuer: "test-magic-link-issuer",
      kid: "test-magic-link-kid",
      secondsDuration: 120,
    },
    frontendActivationPath: "/activate",
    frontendBaseUrl: "https://test-frontend.example",
    internalJwt: {
      audience: "test-audience",
      issuer: "test-issuer",
      kid: "test-kid",
      secondsDuration: 3600,
      subject: "test-subject",
    },
    keychainProcessUrl: "http://localhost:0",
    loggerConfig: {
      isProduction: false,
      logLevel: "silent",
      nodeEnv: "test",
    },
    organizationProcessUrl: "http://localhost:0",
    pollingService: pollingServiceBuilder({
      defaultPollingMaxRetries: 1,
      defaultPollingRetryDelay: 0,
    }),
    purposeProcessUrl: "http://localhost:0",
  });
});
