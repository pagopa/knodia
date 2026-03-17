import type { Eservice } from "@knodia/eservice-models";

import { generateId } from "@knodia/common-models/ids";
import { eventStoreEserviceEvents } from "@knodia/db-event-store-eservice";
import { eserviceEventStoreWriterBuilder } from "@knodia/db-event-store-writer/eservice";
import { createInjectAppRequest } from "@knodia/test-commons/fastify";

import { createEserviceVersionActivatedV1Event } from "../src/models/eserviceEventFactory.ts";
import { app, eventStoreDb } from "./setup.ts";
import { eserviceWriterService } from "./setup.ts";

export async function getAllEserviceEvents() {
  return await eventStoreDb.select().from(eventStoreEserviceEvents);
}

export const injectAppRequest = createInjectAppRequest(() => app);

export async function seedEservice(eservice: Eservice) {
  const latestVersion = eservice.versions.reduce((latest, version) =>
    version.versionNumber > latest.versionNumber ? version : latest,
  );

  await eserviceEventStoreWriterBuilder(eventStoreDb).insertEvent(
    createEserviceVersionActivatedV1Event(
      eservice,
      latestVersion.id,
      generateId(),
    ),
  );
  await eserviceWriterService.upsertEservice(eservice, 0);
}
