import { generateId, type OrganizationId } from "@knodia/common-models/ids";
import { eventStoreEserviceEvents } from "@knodia/db-event-store-eservice";
import { eserviceEventStoreWriterBuilder } from "@knodia/db-event-store-writer/eservice";
import {
  type Eservice,
  type EserviceVersionState,
} from "@knodia/eservice-models";
import { TEST_ORGANIZATION_ID } from "@knodia/test-commons/auth";
import { createInjectAppRequest } from "@knodia/test-commons/fastify";
import {
  getMockEservice,
  getMockEserviceVersion,
} from "@knodia/test-commons/utils";

import { createEserviceVersionActivatedV1Event } from "../src/models/eserviceEventFactory.ts";
import { app, eserviceWriterService, eventStoreDb } from "./setup.ts";

export async function getAllEserviceEvents() {
  return await eventStoreDb
    .select()
    .from(eventStoreEserviceEvents)
    .orderBy(eventStoreEserviceEvents.sequenceNum);
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

export const makeEserviceWithVersionState = (
  state: EserviceVersionState,
  seed: number,
  producerId: OrganizationId = TEST_ORGANIZATION_ID,
): Eservice => ({
  ...getMockEservice({ seed }),
  producerId,
  template: undefined,
  versions: [
    {
      ...getMockEserviceVersion(seed),
      state,
      versionNumber: 1,
    },
  ],
});
