import type { FileManager } from "@knodia/file-manager";

import {
  type EserviceWriterService,
  eserviceWriterServiceBuilder,
} from "@knodia/db-readmodel-eservice/writer";
import { setupEventstoreTestDatabase } from "@knodia/test-commons/eventstore";
import { setupReadmodelTestDatabase } from "@knodia/test-commons/readmodel";
import { afterAll, afterEach, beforeAll, beforeEach, inject } from "vitest";

import { buildApp } from "../src/app.ts";

let eventStoreDb: Awaited<ReturnType<typeof setupEventstoreTestDatabase>>;
let readmodelDb: Awaited<ReturnType<typeof setupReadmodelTestDatabase>>;
let app: ReturnType<typeof buildApp>;
let eserviceWriterService: EserviceWriterService;

const stubFileManager: FileManager = {
  getBytes: async () => ({
    content: Buffer.from("stub"),
    contentType: "application/octet-stream",
  }),
  storeBytes: async (s3File) => s3File.key,
};

beforeAll(async () => {
  const connectionString = inject("POSTGRES_CONNECTION_STRING");

  eventStoreDb = await setupEventstoreTestDatabase(connectionString);
  readmodelDb = await setupReadmodelTestDatabase(connectionString);

  app = buildApp({
    config: {
      acceptedAudiences: ["test-audience"],
      eserviceInterfacesS3Bucket: "test-bucket",
      isProduction: false,
      logLevel: "silent",
      nodeEnv: "test",
      wellKnownUrls: ["https://test.example.com/.well-known/jwks.json"],
    },
    eventStoreDb,
    fileManager: stubFileManager,
    readmodelDb,
  });

  eserviceWriterService = eserviceWriterServiceBuilder(readmodelDb);
});

beforeEach(async () => {
  await Promise.all([
    eventStoreDb.execute("BEGIN"),
    readmodelDb.execute("BEGIN"),
  ]);
});

afterEach(async () => {
  await Promise.all([
    eventStoreDb.execute("ROLLBACK"),
    readmodelDb.execute("ROLLBACK"),
  ]);
});

afterAll(async () => {
  await Promise.all([eventStoreDb.$client.end(), readmodelDb.$client.end()]);
});

export { app, eserviceWriterService, eventStoreDb };
