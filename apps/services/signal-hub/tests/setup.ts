import type { TestDrizzleDb } from "@knodia/test-commons/types";
import type { FastifyInstance } from "fastify";

import { readmodelEservice } from "@knodia/db-readmodel-eservice";
import {
  type EserviceWriterService,
  eserviceWriterServiceBuilder,
} from "@knodia/db-readmodel-eservice/writer";
import { signalHubSignal } from "@knodia/db-signal-hub";
import {
  type SignalHubDbService,
  signalHubDbServiceBuilder,
} from "@knodia/db-signal-hub/services";
import { setupReadmodelTestDatabase } from "@knodia/test-commons/readmodel";
import { setupSignalHubTestDatabase } from "@knodia/test-commons/signalHubDb";
import { resetTestDatabase } from "@knodia/test-commons/utils";
import { afterAll, afterEach, beforeAll, inject } from "vitest";

import { buildApp } from "../src/app.ts";

let signalHubDb: TestDrizzleDb;
let readmodelDb: TestDrizzleDb;
let app: FastifyInstance;
let eserviceWriterService: EserviceWriterService;
let signalHubDbService: SignalHubDbService;
const timeWindowInSeconds = 2;

async function resetTestDatabases() {
  await Promise.all([
    resetTestDatabase(signalHubDb, signalHubSignal),
    resetTestDatabase(readmodelDb, readmodelEservice),
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
      logLevel: "silent",
      nodeEnv: "test",
      wellKnownUrls: ["https://test.example.com/.well-known/jwks.json"],
    },
    readmodelDb,
    signalHubDb,
    timeWindowInSeconds,
  });

  eserviceWriterService = eserviceWriterServiceBuilder(readmodelDb);
  signalHubDbService = signalHubDbServiceBuilder(signalHubDb);
});

afterEach(async () => {
  await resetTestDatabases();
});

afterAll(async () => {
  await Promise.all([signalHubDb.$client.end(), readmodelDb.$client.end()]);
});

export {
  app,
  eserviceWriterService,
  readmodelDb,
  signalHubDb,
  signalHubDbService,
  timeWindowInSeconds,
};
