import { organizationWriterServiceBuilder } from "@knodia/db-readmodel-organization/writer";
import {
  remoteResourceAgreement,
  remoteResourcePurpose,
} from "@knodia/db-remote-resource";
import {
  type RemoteResourceDbService,
  remoteResourceDbServiceBuilder,
} from "@knodia/db-remote-resource/services";
import { TEST_ORGANIZATION_ID } from "@knodia/test-commons/auth";
import { setupReadmodelTestDatabase } from "@knodia/test-commons/readmodel";
import { setupRemoteResourceTestDatabase } from "@knodia/test-commons/remoteResourceDb";
import {
  getMockOrganization,
  resetTestDatabase,
} from "@knodia/test-commons/utils";
import { afterAll, afterEach, beforeAll, inject } from "vitest";

import { buildApp } from "../src/app.ts";

let app: ReturnType<typeof buildApp>;
let remoteResourceDb: Awaited<
  ReturnType<typeof setupRemoteResourceTestDatabase>
>;
let readmodelDb: Awaited<ReturnType<typeof setupReadmodelTestDatabase>>;
let remoteResourceDbService: RemoteResourceDbService;

beforeAll(async () => {
  const connectionString = inject("POSTGRES_CONNECTION_STRING");

  remoteResourceDb = await setupRemoteResourceTestDatabase(connectionString);
  readmodelDb = await setupReadmodelTestDatabase(connectionString);

  app = buildApp({
    config: {
      acceptedAudiences: ["test-audience"],
      isProduction: false,
      logLevel: "silent",
      nodeEnv: "test",
      wellKnownUrls: ["https://test.example.com/.well-known/jwks.json"],
    },
    knodeUrl: "http://localhost:0",
    readmodelDb,
    remoteResourceDb,
  });

  remoteResourceDbService = remoteResourceDbServiceBuilder(remoteResourceDb);

  const organizationWriterService =
    organizationWriterServiceBuilder(readmodelDb);
  await organizationWriterService.upsertOrganization(
    {
      ...getMockOrganization(),
      id: TEST_ORGANIZATION_ID,
    },
    0,
  );
});

afterEach(async () => {
  await resetTestDatabase(
    remoteResourceDb,
    remoteResourceAgreement,
    remoteResourcePurpose,
  );
});

afterAll(async () => {
  await readmodelDb.$client.end();
  await remoteResourceDb.$client.end();
});

export { app, remoteResourceDbService };
