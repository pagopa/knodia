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
import { readmodelKnodeApiKeychain } from "@knodia/db-readmodel-keychain";
import {
  type KnodeApiKeychainWriterService,
  knodeApiKeychainWriterServiceBuilder,
} from "@knodia/db-readmodel-keychain/services";
import { readmodelPurpose } from "@knodia/db-readmodel-purpose";
import {
  type PurposeWriterService,
  purposeWriterServiceBuilder,
} from "@knodia/db-readmodel-purpose/writer";
import { noopRateLimiter } from "@knodia/fastify-zod-api-commons/rate-limit";
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
let knodeApiKeychainWriterService: KnodeApiKeychainWriterService;
let purposeWriterService: PurposeWriterService;
let dynamoClient: DynamoDBClient;
const producerKnodeId: KnodeId = "Orion";
const dpopProofHtuBaseUrl = "https://test.knodia.org/token";
const dynamoDbDpopProofsTable = "knodia-auth-server-dpop-proofs";

async function resetTestDatabases() {
  await Promise.all([
    // TRUNCATE CASCADE handles knode_api_keychain_user/key via ON DELETE CASCADE.
    resetTestDatabase(
      readmodelDb,
      readmodelAgreement,
      readmodelEservice,
      readmodelKnodeApiKeychain,
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
      clientAssertionMaxTokenAgeSeconds: 300,
      dpopProofHtuBaseUrl,
      dpopProofMaxTokenAgeSeconds: 300,
      dynamoDbDpopProofsTable,
      eserviceAccessTokenJwtKid: "test-kid",
      eserviceClientAssertionAcceptedAudiences: [
        "test-eservice-audience-1",
        "test-eservice-audience-2",
      ],
      generatedEserviceAccessTokenIssuer: "knodia.org",
      generatedKnodeApiTokenAudience: "test-knode-api-audience",
      generatedKnodeApiTokenIssuer: "knodia.org",
      host: "test_host",
      isProduction: false,
      jwtClockToleranceSeconds: 30,
      knodeApiClientAssertionAcceptedAudiences: [
        "test-knode-api-accepted-audience-1",
        "test-knode-api-accepted-audience-2",
      ],
      knodeApiTokenDurationSeconds: 3600,
      knodeApiTokenJwtKid: "test-knode-api-kid",
      knodeId: producerKnodeId,
      logLevel: "silent",
      nodeEnv: "test",
      port: 0,
      rateLimiterMaxRequests: 100,
      rateLimiterRedisHost:
        process.env["RATE_LIMITER_REDIS_HOST"] ?? "127.0.0.1",
      rateLimiterRedisPort: Number(
        process.env["RATE_LIMITER_REDIS_PORT"] ?? 6379,
      ),
      rateLimiterTimeoutSeconds: 2,
      rateLimiterTimeWindowSeconds: 60,
      readmodelDbAgreementSchema: "test_agreement_schema",
      readmodelDbEserviceSchema: "test_eservice_schema",
      readmodelDbHost: "test_db_host",
      readmodelDbKeychainSchema: "test_keychain_schema",
      readmodelDbName: "test_db_name",
      readmodelDbPassword: "test_db_password",
      readmodelDbPort: 0,
      readmodelDbPurposeSchema: "test_purpose_schema",
      readmodelDbUser: "test_db_user",
      readmodelDbUseSsl: false,
      targetKnodeUrls: {
        Lynx: "http://localhost:0",
        Orion: "http://localhost:0",
      },
    },
    dynamoClient,
    rateLimiter: noopRateLimiter,
    readmodelDb,
  });

  await app.ready();

  agreementWriterService = agreementWriterServiceBuilder(readmodelDb);
  eserviceWriterService = eserviceWriterServiceBuilder(readmodelDb);
  knodeApiKeychainWriterService =
    knodeApiKeychainWriterServiceBuilder(readmodelDb);
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
  knodeApiKeychainWriterService,
  producerKnodeId,
  purposeWriterService,
};
