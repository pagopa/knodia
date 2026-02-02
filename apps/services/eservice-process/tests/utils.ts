import { readmodelEservice } from "@knodia/db-readmodel-eservice";

import { db } from "./setup.ts";

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
