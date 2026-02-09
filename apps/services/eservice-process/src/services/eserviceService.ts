import type { EserviceEventStoreWriter } from "@knodia/db-event-store-writer/eservice";
import type { Eservice } from "@knodia/eservice-models";

import { type RequestContextData } from "@fastify/request-context";
import { getAttribute } from "@knodia/attribute-models";
import { getCategory } from "@knodia/category-models";
import {
  type EserviceId,
  type EserviceInterfaceId,
  type EserviceVersionId,
  generateId,
  type OrganizationId,
} from "@knodia/common-models/ids";

import type { API_EserviceSeed } from "../models/api.ts";

import { invalidAttribute, invalidCategory } from "../models/errors.ts";
import { createEserviceVersionActivatedV1Event } from "../models/eserviceEventFactory.ts";

export type EserviceService = ReturnType<typeof eserviceServiceBuilder>;

export function eserviceServiceBuilder(
  eventStoreWriter: EserviceEventStoreWriter,
) {
  return {
    async createEservice(
      seed: API_EserviceSeed,
      { correlationId, logger }: RequestContextData,
    ): Promise<Eservice> {
      const eserviceId = generateId<EserviceId>();
      const producerId = generateId<OrganizationId>(); // TODO get from context after implementing auth

      logger.info(
        `Creating E-service ${eserviceId} for producer ${producerId} `,
      );

      for (const attr of seed.requiredAttributes.flat()) {
        if (getAttribute(attr.scheme, attr.code) === undefined) {
          throw invalidAttribute(attr.scheme, attr.code);
        }
      }

      for (const cat of seed.categories ?? []) {
        if (getCategory(cat.scheme, cat.code) === undefined) {
          throw invalidCategory(cat.scheme, cat.code);
        }
      }

      const now = new Date();
      const eserviceVersionId = generateId<EserviceVersionId>();
      const eserviceInterfaceId = generateId<EserviceInterfaceId>();

      const eservice: Eservice = {
        categories: seed.categories ?? [],
        createdAt: now,
        description: seed.description,
        id: eserviceId,
        isConsumerOperatorIdentificationRequired:
          seed.isConsumerOperatorIdentificationRequired ?? false,
        isSignalHubEnabled: seed.isSignalHubEnabled ?? false,
        mode: seed.mode ?? "ProvideData",
        name: seed.name,
        producerId,
        updatedAt: now,
        versions: [
          {
            accessTokenAudience: seed.accessTokenAudience,
            accessTokenDuration: seed.accessTokenDuration ?? 3600,
            accessTokenType: seed.accessTokenType ?? "Bearer",
            createdAt: now,
            id: eserviceVersionId,
            // TODO: implement interface document upload
            interfaceDocument: {
              checksum: "checksum-1",
              contentType: "application/json",
              createdAt: now,
              id: eserviceInterfaceId,
              name: "Interface 1",
              path: "/interfaces/1.json",
              prettyName: { en: "Interface 1" },
              updatedAt: now,
            },
            maxDailyCallsPerConsumer: seed.maxDailyCallsPerConsumer,
            maxDailyCallsPerKnode: seed.maxDailyCallsPerKnode,
            requiredAttributes: seed.requiredAttributes,
            state: "Active",
            updatedAt: now,
            versionNumber: 1,
          },
        ],
      };

      await eventStoreWriter.insertEvent(
        createEserviceVersionActivatedV1Event(
          eservice,
          eserviceVersionId,
          correlationId,
        ),
      );

      return eservice;
    },
    getMockEservices(
      offset: number,
      limit: number,
    ): {
      items: Eservice[];
      pagination: { limit: number; offset: number; total: number };
    } {
      // Mock data: 100 e-services with ids 0 to 99, with pagination support
      const now = new Date();
      const eservices: Eservice[] = new Array(100).fill(null).map((_, idx) => ({
        categories: [{ code: "category-1", scheme: "vocab-1" }],
        createdAt: now,
        description: { en: `Description for E-service ${idx}` },
        id: generateId<EserviceId>(),
        isConsumerOperatorIdentificationRequired: false,
        isSignalHubEnabled: false,
        mode: "ProvideData" as const,
        name: { en: `E-service ${idx}` },
        producerId: generateId<OrganizationId>(),
        updatedAt: now,
        versions: [
          {
            accessTokenAudience: ["audience-1"],
            accessTokenDuration: 3600,
            accessTokenType: "Bearer" as const,
            createdAt: now,
            id: generateId<EserviceVersionId>(),
            interfaceDocument: {
              checksum: "checksum-1",
              contentType: "application/json",
              createdAt: now,
              id: generateId<EserviceInterfaceId>(),
              name: "Interface 1",
              path: "/interfaces/1.json",
              prettyName: { en: "Interface 1" },
              updatedAt: now,
            },
            maxDailyCallsPerConsumer: 100,
            maxDailyCallsPerKnode: 1000,
            requiredAttributes: [[{ code: "attr-1", scheme: "attr-scheme-1" }]],
            state: "Active" as const,
            updatedAt: now,
            versionNumber: 1,
          },
        ],
      }));

      return {
        items: eservices.slice(offset, offset + limit),
        pagination: {
          limit,
          offset,
          total: eservices.length,
        },
      };
    },
  };
}
