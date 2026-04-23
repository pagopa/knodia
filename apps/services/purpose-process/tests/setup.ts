import type { TestDrizzleDb } from "@knodia/test-commons/types";
import type { FastifyInstance } from "fastify";

import { PutObjectCommand, type S3Client } from "@aws-sdk/client-s3";
import { eventStorePurposeEvents } from "@knodia/db-event-store-purpose";
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
import { initFileManager } from "@knodia/file-manager";
import { PurposeFormSchemaVersion } from "@knodia/purpose-models";
import { setupEventstoreTestDatabase } from "@knodia/test-commons/eventstore";
import { setupMinioTestBucket } from "@knodia/test-commons/minio";
import { setupReadmodelTestDatabase } from "@knodia/test-commons/readmodel";
import { resetTestDatabase } from "@knodia/test-commons/utils";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, afterEach, beforeAll, inject } from "vitest";

import { buildApp } from "../src/app.ts";
import {
  BUNDLE_FILES,
  CURRENT_POINTER_FILE,
  type FormSchemaStore,
  formSchemaStoreBuilder,
} from "../src/services/formSchemaStore.ts";

const TEST_FORM_VERSION = PurposeFormSchemaVersion.enum["1.0"];
const SEED_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "seed",
  "forms",
  TEST_FORM_VERSION,
);

let eventStoreDb: TestDrizzleDb;
let readmodelDb: TestDrizzleDb;
let app: FastifyInstance;
let eserviceWriterService: EserviceWriterService;
let agreementWriterService: AgreementWriterService;
let formSchemaStore: FormSchemaStore;
let cleanupMinioAfterAll: () => Promise<void>;

const uploadJson = (
  s3Client: S3Client,
  bucket: string,
  key: string,
  body: string,
) =>
  s3Client.send(
    new PutObjectCommand({
      Body: Buffer.from(body, "utf-8"),
      Bucket: bucket,
      ContentType: "application/json",
      Key: key,
    }),
  );

async function resetTestDatabases() {
  await Promise.all([
    resetTestDatabase(eventStoreDb, eventStorePurposeEvents),
    resetTestDatabase(
      readmodelDb,
      readmodelPurpose,
      readmodelEservice,
      readmodelAgreement,
    ),
  ]);
}

beforeAll(async () => {
  const connectionString = inject("POSTGRES_CONNECTION_STRING");

  eventStoreDb = await setupEventstoreTestDatabase(connectionString);
  readmodelDb = await setupReadmodelTestDatabase(connectionString);

  const minio = await setupMinioTestBucket(inject("MINIO_CONNECTION_STRING"));
  cleanupMinioAfterAll = minio.cleanupAfterAll;

  const versionPrefix = `versions/${TEST_FORM_VERSION}`;
  await Promise.all(
    Object.values(BUNDLE_FILES).map((file) =>
      uploadJson(
        minio.s3Client,
        minio.bucket,
        `${versionPrefix}/${file}`,
        readFileSync(join(SEED_DIR, file), "utf-8"),
      ),
    ),
  );
  await uploadJson(
    minio.s3Client,
    minio.bucket,
    CURRENT_POINTER_FILE,
    JSON.stringify({ version: TEST_FORM_VERSION }),
  );

  formSchemaStore = formSchemaStoreBuilder({
    bucket: minio.bucket,
    fileManager: initFileManager(minio.s3Client),
  });

  app = buildApp({
    config: {
      acceptedAudiences: ["test-audience"],
      isProduction: false,
      logLevel: "silent",
      nodeEnv: "test",
      wellKnownUrls: ["https://test.example.com/.well-known/jwks.json"],
    },
    eventStoreDb,
    formSchemaStore,
    readmodelDb,
  });

  eserviceWriterService = eserviceWriterServiceBuilder(readmodelDb);
  agreementWriterService = agreementWriterServiceBuilder(readmodelDb);
});

afterEach(async () => {
  await resetTestDatabases();
});

afterAll(async () => {
  await Promise.all([
    eventStoreDb.$client.end(),
    readmodelDb.$client.end(),
    cleanupMinioAfterAll(),
  ]);
});

export {
  agreementWriterService,
  app,
  eserviceWriterService,
  eventStoreDb,
  formSchemaStore,
  readmodelDb,
  TEST_FORM_VERSION,
};
