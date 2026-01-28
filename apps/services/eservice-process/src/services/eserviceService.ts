import type { EserviceEventStoreWriter } from "@knodia/db-event-store-eservice/writer";

import { type RequestContextData } from "@fastify/request-context";
import {
  type EserviceId,
  type EserviceInterfaceId,
  type EserviceVersionId,
  generateId,
  type OrganizationId,
} from "@knodia/common-models/ids";
import { type Eservice } from "@knodia/eservice-models";

import { createEserviceVersionActivatedV1Event } from "../models/eserviceEventFactory.ts";

export type EserviceService = ReturnType<typeof eserviceServiceBuilder>;

export function eserviceServiceBuilder(
  eventStoreWriter: EserviceEventStoreWriter,
) {
  return {
    createEservice(name: string, ctx: RequestContextData): Eservice {
      // TODO use logger from context and log the creation

      const now = new Date();

      const eserviceId = generateId<EserviceId>();
      const eserviceVersionId = generateId<EserviceVersionId>();
      const eserviceInterfaceId = generateId<EserviceInterfaceId>();
      const producerId = generateId<OrganizationId>(); // TODO get from context after implementing auth
      const eservice: Eservice = {
        categories: [{ code: "category-1", scheme: "vocab-1" }],
        createdAt: now,
        description: { en: "Mock description" },
        id: eserviceId,
        isConsumerOperatorIdentificationRequired: false,
        isSignalHubEnabled: false,
        mode: "ProvideData",
        name: { en: name },
        producerId,
        updatedAt: now,
        versions: [
          {
            accessTokenAudience: ["audience-1"],
            accessTokenDuration: 3600,
            accessTokenType: "Bearer",
            createdAt: now,
            id: eserviceVersionId,
            interfaceDocument: {
              checksum: "checksum-1",
              contentType: "application/json",
              createdAt: now,
              id: eserviceInterfaceId,
              name: "Interface 1",
              path: "/interfaces/1.json",
              prettyName: {
                en: "Interface 1",
              },
              updatedAt: now,
            },
            maxDailyCallsPerConsumer: 100,
            maxDailyCallsPerKnode: 1000,
            requiredAttributes: [[{ code: "attr-1", scheme: "attr-scheme-1" }]],
            state: "Active",
            updatedAt: now,
            versionNumber: 1,
          },
        ],
      };

      eventStoreWriter.insertEserviceEvent(
        createEserviceVersionActivatedV1Event(
          eservice,
          eserviceVersionId,
          ctx.correlationId,
        ),
      );

      return eservice;
    },
    getMockEservices(
      offset: number,
      limit: number,
    ): {
      items: { name: { en: string } }[];
      pagination: { limit: number; offset: number; total: number };
    } {
      // Mock data: 100 e-services with ids 0 to 99, with pagination support
      const eservices = new Array(100).fill(null).map((_, idx) => ({
        id: idx,
      }));

      return {
        items: eservices.slice(offset, offset + limit).map((eservice) => ({
          name: { en: `E-service ${eservice.id}` },
        })),
        pagination: {
          limit,
          offset,
          total: eservices.length,
        },
      };
    },
  };
}
