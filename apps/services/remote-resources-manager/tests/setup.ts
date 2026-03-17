import { remoteResourceAgreement } from "@knodia/db-remote-resource";
import {
  type RemoteResourceDbService,
  remoteResourceDbServiceBuilder,
} from "@knodia/db-remote-resource/services";
import { setupRemoteResourceTestDatabase } from "@knodia/test-commons/remoteResourceDb";
import { resetTestDatabase } from "@knodia/test-commons/utils";
import { afterAll, afterEach, beforeAll, inject } from "vitest";

import { buildApp } from "../src/app.ts";

let app: ReturnType<typeof buildApp>;
let remoteResourceDb: Awaited<
  ReturnType<typeof setupRemoteResourceTestDatabase>
>;
let remoteResourceDbService: RemoteResourceDbService;

beforeAll(async () => {
  const connectionString = inject("POSTGRES_CONNECTION_STRING");

  remoteResourceDb = await setupRemoteResourceTestDatabase(connectionString);

  app = buildApp({
    config: {
      acceptedAudiences: ["test-audience"],
      isProduction: false,
      logLevel: "silent",
      nodeEnv: "test",
      wellKnownUrls: ["https://test.example.com/.well-known/jwks.json"],
    },
    knodeUrl: "http://localhost:0",
    remoteResourceDb,
  });

  remoteResourceDbService = remoteResourceDbServiceBuilder(remoteResourceDb);
});

afterEach(async () => {
  await resetTestDatabase(remoteResourceDb, remoteResourceAgreement);
});

afterAll(async () => {
  await Promise.all([remoteResourceDb.$client.end()]);
});

export { app, remoteResourceDbService };
