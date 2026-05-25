import type { TestDrizzleDb } from "@knodia/test-commons/types";
import type { FastifyInstance } from "fastify";

import { readmodelAgreement } from "@knodia/db-readmodel-agreement";
import {
  type AgreementWriterService,
  agreementWriterServiceBuilder,
} from "@knodia/db-readmodel-agreement/writer";
import { readmodelEservice } from "@knodia/db-readmodel-eservice";
import {
  type EserviceWriterService,
  eserviceWriterServiceBuilder,
} from "@knodia/db-readmodel-eservice/writer";
import { readmodelPurpose } from "@knodia/db-readmodel-purpose";
import {
  type PurposeWriterService,
  purposeWriterServiceBuilder,
} from "@knodia/db-readmodel-purpose/writer";
import { signalHubSignal } from "@knodia/db-signal-hub";
import { setupReadmodelTestDatabase } from "@knodia/test-commons/readmodel";
import { setupSignalHubTestDatabase } from "@knodia/test-commons/signalHubDb";
import { resetTestDatabase } from "@knodia/test-commons/utils";
import { afterAll, afterEach, beforeAll, inject } from "vitest";

import { buildApp } from "../src/app.ts";

let signalHubDb: TestDrizzleDb;
let readmodelDb: TestDrizzleDb;
let app: FastifyInstance;
let eserviceWriterService: EserviceWriterService;
let agreementWriterService: AgreementWriterService;
let purposeWriterService: PurposeWriterService;

async function resetTestDatabases() {
  await Promise.all([
    resetTestDatabase(signalHubDb, signalHubSignal),
    resetTestDatabase(
      readmodelDb,
      readmodelEservice,
      readmodelAgreement,
      readmodelPurpose,
    ),
  ]);
}

beforeAll(async () => {
  const connectionString = inject("POSTGRES_CONNECTION_STRING");

  signalHubDb = await setupSignalHubTestDatabase(connectionString);
  readmodelDb = await setupReadmodelTestDatabase(connectionString);

  app = buildApp({
    config: {
      acceptedAudiences: ["test-audience"],
      isProduction: false,
      knodeId: "Orion",
      logLevel: "silent",
      nodeEnv: "test",
      rateLimiterMaxRequests: 200,
      rateLimiterRedisHost: "localhost",
      rateLimiterRedisPort: 6379,
      rateLimiterTimeoutSeconds: 2,
      rateLimiterTimeWindowSeconds: 60,
      wellKnownUrls: ["https://test.example.com/.well-known/jwks.json"],
    },
    readmodelDb,
    signalHubDb,
  });

  await app.ready();

  eserviceWriterService = eserviceWriterServiceBuilder(readmodelDb);
  agreementWriterService = agreementWriterServiceBuilder(readmodelDb);
  purposeWriterService = purposeWriterServiceBuilder(readmodelDb);
});

afterEach(async () => {
  await resetTestDatabases();
});

afterAll(async () => {
  await Promise.all([
    app.close(),
    signalHubDb.$client.end(),
    readmodelDb.$client.end(),
  ]);
});

export {
  agreementWriterService,
  app,
  eserviceWriterService,
  purposeWriterService,
  signalHubDb,
};
