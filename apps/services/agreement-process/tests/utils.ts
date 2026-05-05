import type { Agreement } from "@knodia/agreement-models";

import { generateId } from "@knodia/common-models/ids";
import { eventStoreAgreementEvents } from "@knodia/db-event-store-agreement";
import { agreementEventStoreWriterBuilder } from "@knodia/db-event-store-writer/agreement";
import { createInjectAppRequest } from "@knodia/test-commons/fastify";
import { toExpectIsoOrNull } from "@knodia/test-commons/utils";
import { expect } from "vitest";

import type { API_Agreement } from "../src/models/api.ts";

import {
  createAgreementActivatedV1Event,
  createAgreementCreatedPendingConsumerOperatorIdentificationV1Event,
} from "../src/models/agreementEventFactory.ts";
import { agreementWriterService, app, eventStoreDb } from "./setup.ts";

export async function getAllAgreementEvents() {
  return await eventStoreDb.select().from(eventStoreAgreementEvents);
}

export const injectAppRequest = createInjectAppRequest(() => app);

export async function seedAgreement(agreement: Agreement) {
  await agreementEventStoreWriterBuilder(eventStoreDb).insertEvent(
    createAgreementActivatedV1Event(agreement, generateId()),
  );
  await agreementWriterService.upsertAgreement(agreement, 0);
}

export async function seedPendingAgreement(agreement: Agreement) {
  await agreementEventStoreWriterBuilder(eventStoreDb).insertEvent(
    createAgreementCreatedPendingConsumerOperatorIdentificationV1Event(
      agreement,
      generateId(),
    ),
  );
  await agreementWriterService.upsertAgreement(agreement, 0);
}

export function toExpectAPI_Agreement(agreement: Agreement | API_Agreement) {
  return {
    ...agreement,
    attributes: expect.arrayContaining(agreement.attributes),
    createdAt: toExpectIsoOrNull(agreement.createdAt),
    suspendedByConsumerAt: toExpectIsoOrNull(agreement.suspendedByConsumerAt),
    suspendedByProducerAt: toExpectIsoOrNull(agreement.suspendedByProducerAt),
    updatedAt: toExpectIsoOrNull(agreement.updatedAt),
  };
}
