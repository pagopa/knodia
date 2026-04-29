import type { KnodeId } from "@knodia/common-models/ids";
import type { TestDrizzleDb } from "@knodia/test-commons/types";
import type { FastifyInstance } from "fastify";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import "@knodia/test-commons/dynamodb";
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
import {
  resetDynamoTable,
  resetTestDatabase,
} from "@knodia/test-commons/utils";
import { afterAll, afterEach, beforeAll, inject } from "vitest";

import { buildApp } from "../src/app.ts";

let readmodelDb: TestDrizzleDb;
let app: FastifyInstance;
let agreementWriterService: AgreementWriterService;
let eserviceWriterService: EserviceWriterService;
let purposeWriterService: PurposeWriterService;
let dynamoClient: DynamoDBClient;
const producerKnodeId: KnodeId = "Orion";
const dpopProofHtuBaseUrl = "https://test.knodia.org/token";
const dynamoDbDpopProofsTable = "knodia-auth-server-dpop-proofs";

async function resetTestDatabases() {
  await Promise.all([
    resetTestDatabase(
      readmodelDb,
      readmodelAgreement,
      readmodelEservice,
      readmodelPurpose,
    ),
    resetDynamoTable(dynamoDbDpopProofsTable, "jti", dynamoClient),
  ]);
}

beforeAll(async () => {
  const connectionString = inject("POSTGRES_CONNECTION_STRING");

  readmodelDb = await setupReadmodelTestDatabase(connectionString);

  dynamoClient = new DynamoDBClient({
    credentials: { accessKeyId: "test", secretAccessKey: "test" },
    endpoint: inject("DYNAMODB_CONNECTION_STRING"),
    region: "eu-south-1",
  });

  app = buildApp({
    config: {
      clientAssertionAcceptedAudiences: ["test-audience-1", "test-audience-2"],
      clientAssertionMaxTokenAgeSeconds: 300,
      consumerKnodeUrl: "http://localhost:0",
      dpopProofHtuBaseUrl,
      dpopProofMaxTokenAgeSeconds: 300,
      dynamoDbDpopProofsTable,
      eserviceAccessTokenJwtKid: "test-kid",
      generatedEserviceAccessTokenIssuer: "knodia.org",
      host: "test_host",
      isProduction: false,
      jwtClockToleranceSeconds: 30,
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
    sharedDynamoClient: dynamoClient,
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
  dynamoClient.destroy();
  await Promise.all([app.close(), readmodelDb.$client.end()]);
});

export {
  agreementWriterService,
  app,
  dpopProofHtuBaseUrl,
  dynamoClient,
  dynamoDbDpopProofsTable,
  eserviceWriterService,
  producerKnodeId,
  purposeWriterService,
};
