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
import { setupReadmodelTestDatabase } from "@knodia/test-commons/readmodel";
import { resetTestDatabase } from "@knodia/test-commons/utils";
import { afterAll, afterEach, beforeAll, inject } from "vitest";

import { buildApp } from "../src/app.ts";

let readmodelDb: TestDrizzleDb;
let app: FastifyInstance;
let agreementWriterService: AgreementWriterService;
let eserviceWriterService: EserviceWriterService;
let purposeWriterService: PurposeWriterService;

async function resetTestDatabases() {
  await Promise.all([
    resetTestDatabase(
      readmodelDb,
      readmodelAgreement,
      readmodelEservice,
      readmodelPurpose,
    ),
  ]);
}

beforeAll(async () => {
  const connectionString = inject("POSTGRES_CONNECTION_STRING");

  readmodelDb = await setupReadmodelTestDatabase(connectionString);

  app = buildApp({
    clientAssertionAcceptedAudiences: ["test-audience-1", "test-audience-2"],
    config: {
      isProduction: false,
      logLevel: "silent",
      nodeEnv: "test",
    },
    eserviceAccessTokenJwtKid: "test-kid",
    generatedEserviceAccessTokenIssuer: "knodia.org",
    knodeUrl: "http://localhost:0",
    readmodelDb,
  });

  await app.ready();

  agreementWriterService = agreementWriterServiceBuilder(readmodelDb);
  eserviceWriterService = eserviceWriterServiceBuilder(readmodelDb);
  purposeWriterService = purposeWriterServiceBuilder(readmodelDb);
});

afterEach(async () => {
  await resetTestDatabases();
});

afterAll(async () => {
  await Promise.all([app.close(), readmodelDb.$client.end()]);
});

export {
  agreementWriterService,
  app,
  eserviceWriterService,
  purposeWriterService,
};
