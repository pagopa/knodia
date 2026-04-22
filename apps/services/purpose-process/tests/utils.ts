import type { Eservice } from "@knodia/eservice-models";
import type { Purpose } from "@knodia/purpose-models";

import { generateId } from "@knodia/common-models/ids";
import { eventStorePurposeEvents } from "@knodia/db-event-store-purpose";
import { purposeEventStoreWriterBuilder } from "@knodia/db-event-store-writer/purpose";
import { createInjectAppRequest } from "@knodia/test-commons/fastify";

import type { API_Purpose } from "../src/models/api.ts";

import { createPurposeActivatedV1Event } from "../src/models/purposeEventFactory.ts";
import {
  app,
  eserviceWriterService,
  eventStoreDb,
  purposeWriterService,
} from "./setup.ts";

export async function getAllPurposeEvents() {
  return await eventStoreDb.select().from(eventStorePurposeEvents);
}

export const injectAppRequest = createInjectAppRequest(() => app);

export async function seedEservice(eservice: Eservice) {
  await eserviceWriterService.upsertEservice(eservice, 0);
}

export async function seedPurpose(purpose: Purpose) {
  await purposeEventStoreWriterBuilder(eventStoreDb).insertEvent(
    createPurposeActivatedV1Event(purpose, generateId()),
  );
  await purposeWriterService.upsertPurpose(purpose, 0);
}

export function toExpectAPI_Purpose(purpose: API_Purpose | Purpose) {
  return {
    // formAnswersJson and formSchemaVersion are intentionally excluded —
    // they can be retrieved via separate routes
    consumer: purpose.consumer,
    createdAt:
      typeof purpose.createdAt === "string"
        ? purpose.createdAt
        : purpose.createdAt.toISOString(),
    dailyCalls: purpose.dailyCalls,
    description: purpose.description,
    eserviceId: purpose.eserviceId,
    id: purpose.id,
    name: purpose.name,
    state: purpose.state,
    suspendedByConsumerAt: toExpectIsoOrNull(purpose.suspendedByConsumerAt),
    suspendedByProducerAt: toExpectIsoOrNull(purpose.suspendedByProducerAt),
    updatedAt:
      typeof purpose.updatedAt === "string"
        ? purpose.updatedAt
        : purpose.updatedAt.toISOString(),
  };
}

function toExpectIsoOrNull(value: Date | null | string) {
  if (value === null) return null;
  return typeof value === "string" ? value : value.toISOString();
}
