import type { KnodeId } from "@knodia/common-models/ids";
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
const producerKnodeId: KnodeId = "Orion";
const dpopProofHtuBaseUrl = "https://test.knodia.org/token";

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
    config: {
      clientAssertionAcceptedAudiences: ["test-audience-1", "test-audience-2"],
      clientAssertionClockToleranceSeconds: 30,
      clientAssertionMaxTokenAgeSeconds: 300,
      consumerKnodeUrl: "http://localhost:0",
      dpopProofHtuBaseUrl,
      dpopProofMaxTokenAgeSeconds: 300,
      eserviceAccessTokenJwtKid: "test-kid",
      generatedEserviceAccessTokenIssuer: "knodia.org",
      host: "test_host",
      isProduction: false,
      knodeId: producerKnodeId,
      logLevel: "silent",
      nodeEnv: "test",
      port: 0,
      readmodelDbAgreementSchema: "test_agreement_schema",
      readmodelDbEserviceSchema: "test_eservice_schema",
      readmodelDbHost: "test_db_host",
      readmodelDbName: "test_db_name",
      readmodelDbPassword: "test_db_password",
      readmodelDbPort: 0,
      readmodelDbPurposeSchema: "test_purpose_schema",
      readmodelDbUser: "test_db_user",
      readmodelDbUseSsl: false,
    },
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
  dpopProofHtuBaseUrl,
  eserviceWriterService,
  producerKnodeId,
  purposeWriterService,
};
