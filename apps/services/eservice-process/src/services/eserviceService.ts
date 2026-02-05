import type { EserviceEventStoreWriter } from "@knodia/db-event-store-writer/eservice";
import type { Eservice } from "@knodia/eservice-models";

import { type RequestContextData } from "@fastify/request-context";
import {
  type EserviceId,
  type EserviceInterfaceId,
  type EserviceVersionId,
  generateId,
  type OrganizationId,
} from "@knodia/common-models/ids";

import type { API_EserviceSeed } from "../models/api.ts";

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
    getMockEserviceById(eserviceId: string): Eservice | undefined {
      const now = new Date();
      return {
        categories: [
          { code: "residence-place", scheme: "vocab-1" },
          { code: "digital-domicile", scheme: "vocab-1" },
        ],
        createdAt: now,
        description: {
          en: "Confirmation of registration at the current address on the date.",
        },
        id: eserviceId as EserviceId,
        isConsumerOperatorIdentificationRequired: true,
        isSignalHubEnabled: true,
        mode: "ProvideData" as const,
        name: { en: "Requesting proof of residence" },
        producerId: generateId<OrganizationId>(),
        updatedAt: now,
        versions: [
          {
            accessTokenAudience: ["www.rigel.orion/residence/v1"],
            accessTokenDuration: 1800,
            accessTokenType: "Bearer" as const,
            createdAt: now,
            id: generateId<EserviceVersionId>(),
            interfaceDocument: {
              checksum:
                "3f653f35f8311c870e209cc672dfc3698081eefe84cc40f1af5bd61db2c54287",
              contentType: "application/yaml",
              createdAt: now,
              id: generateId<EserviceInterfaceId>(),
              name: "api-specs.yaml",
              path: "/interfaces/api-specs.yaml",
              prettyName: { en: "API Specs" },
              updatedAt: now,
            },
            maxDailyCallsPerConsumer: 1000,
            maxDailyCallsPerKnode: 10000,
            requiredAttributes: [
              [
                { code: "NUTS1", scheme: "eu-nuts" },
                { code: "NUTS2", scheme: "eu-nuts" },
              ],
              [{ code: "NUTS3", scheme: "eu-nuts" }],
              [{ code: "NUTS0", scheme: "eu-nuts" }],
            ],
            state: "Active" as const,
            updatedAt: now,
            versionNumber: 1,
          },
        ],
      };
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
