import type { Agreement } from "@knodia/agreement-models";

import { eventStoreAgreementEvents } from "@knodia/db-event-store-agreement";
import { createInjectAppRequest } from "@knodia/test-commons/fastify";
import { expect } from "vitest";

import { app, eventStoreDb } from "./setup.ts";

export async function getAllAgreementEvents() {
  return await eventStoreDb.select().from(eventStoreAgreementEvents);
}

export const injectAppRequest = createInjectAppRequest(() => app);

export function toExpectAPI_Agreement(agreement: Agreement) {
  return {
    ...agreement,
    attributes: expect.arrayContaining(agreement.attributes),
    createdAt: agreement.createdAt.toISOString(),
    updatedAt: agreement.updatedAt.toISOString(),
  };
}
