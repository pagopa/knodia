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

export { db };
