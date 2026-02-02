import { readmodelEservice } from "@knodia/db-readmodel-eservice";
import { setupReadmodelTestDatabase } from "@knodia/test-commons/readmodel";
import { afterAll, afterEach, beforeAll, beforeEach, inject } from "vitest";

let db: Awaited<ReturnType<typeof setupReadmodelTestDatabase>>;

beforeAll(async () => {
  db = await setupReadmodelTestDatabase(inject("READMODEL_CONNECTION_STRING"));
});

beforeEach(async () => {
  await db.execute("BEGIN");
});

afterEach(async () => {
  await db.execute("ROLLBACK");
});

afterAll(async () => {
  await db.$client.end();
});

export async function getAllEservices() {
  return await db.select().from(readmodelEservice);
}

export async function insertMockEservice() {
  await db.insert(readmodelEservice).values({
    description: { en: "Description" },
    id: crypto.randomUUID(),
    isConsumerOperatorIdentificationRequired: true,
    isSignalHubEnabled: false,
    metadataVersion: 1,
    mode: "REST",
    name: { en: "Test Service " + crypto.randomUUID() },
    producerId: crypto.randomUUID(),
    updatedAt: new Date(),
  });
}
