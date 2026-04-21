import type { Purpose } from "@knodia/purpose-models";

import { eventStorePurposeEvents } from "@knodia/db-event-store-purpose";
import { createInjectAppRequest } from "@knodia/test-commons/fastify";

import type { API_Purpose } from "../src/models/api.ts";

import { app, eventStoreDb } from "./setup.ts";

export async function getAllPurposeEvents() {
  return await eventStoreDb.select().from(eventStorePurposeEvents);
}

export const injectAppRequest = createInjectAppRequest(() => app);

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
