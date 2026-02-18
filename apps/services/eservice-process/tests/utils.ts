import { generateId, unsafeBrandId } from "@knodia/common-models/ids";
import { eventStoreEserviceEvents } from "@knodia/db-event-store-eservice";
import { CORRELATION_ID_HEADER } from "@knodia/fastify-zod-api-commons/models";
import { expect } from "vitest";

import type {
  API_Eservice,
  API_EserviceVersion,
  API_EserviceVersionInterfaceDocument,
} from "../src/models/api.ts";

import { app, eventStoreDb } from "./setup.ts";

export async function getAllEserviceEvents() {
  return await eventStoreDb.select().from(eventStoreEserviceEvents);
}

export function injectAppRequest() {
  return app.inject().headers({
    [CORRELATION_ID_HEADER]: generateId(),
  });
}

export function toExpectAPI_Eservice(eservice: API_Eservice) {
  return {
    categories: expect.arrayContaining(eservice.categories),
    createdAt: eservice.createdAt,
    description: eservice.description,
    id: unsafeBrandId(eservice.id),
    isConsumerOperatorIdentificationRequired:
      eservice.isConsumerOperatorIdentificationRequired,
    isSignalHubEnabled: eservice.isSignalHubEnabled,
    mode: eservice.mode,
    name: eservice.name,
    producerId: unsafeBrandId(eservice.producerId),
    updatedAt: eservice.updatedAt,
  };
}

export function toExpectAPI_EserviceVersion(
  eserviceVersion: API_EserviceVersion,
) {
  return expect.objectContaining({
    accessTokenAudience: expect.arrayContaining(
      eserviceVersion.accessTokenAudience,
    ),
    accessTokenDuration: eserviceVersion.accessTokenDuration,
    accessTokenType: eserviceVersion.accessTokenType,
    createdAt: eserviceVersion.createdAt,
    id: eserviceVersion.id,
    maxDailyCallsPerConsumer: eserviceVersion.maxDailyCallsPerConsumer,
    maxDailyCallsPerKnode: eserviceVersion.maxDailyCallsPerKnode,
    requiredAttributes: eserviceVersion.requiredAttributes.map((group) =>
      expect.arrayContaining(group),
    ),
    state: eserviceVersion.state,
    updatedAt: eserviceVersion.updatedAt,
    versionNumber: eserviceVersion.versionNumber,
  });
}

export function toExpectAPI_EserviceVersionInterfaceDocument(
  doc: API_EserviceVersionInterfaceDocument,
) {
  return {
    checksum: doc.checksum,
    contentType: doc.contentType,
    createdAt: doc.createdAt,
    id: doc.id,
    name: doc.name,
    path: doc.path,
    prettyName: doc.prettyName,
    updatedAt: doc.updatedAt,
  };
}
