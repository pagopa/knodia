import type { Eservice } from "@knodia/eservice-models";

import {
  type AttributeId,
  type EserviceId,
  type EserviceInterfaceId,
  type EserviceVersionId,
  generateId,
  type OrganizationId,
} from "@knodia/common-models/ids";

export type EserviceService = ReturnType<typeof eserviceServiceBuilder>;

export function eserviceServiceBuilder() {
  return {
    createEservice(name: string): Eservice {
      // TODO use logger from context and log the creation

      const now = new Date();

      const eservice: Eservice = {
        categories: ["category-1"],
        createdAt: now,
        description: "Mock description",
        id: generateId<EserviceId>(),
        isSignalHubEnabled: false,
        mode: "ProvideData",
        name,
        producerId: generateId<OrganizationId>(),
        updatedAt: now,
        versions: [
          {
            accessTokenAudience: ["audience-1"],
            accessTokenDuration: 3600,
            accessTokenType: "Bearer",
            createdAt: now,
            id: generateId<EserviceVersionId>(),
            interfaceDocument: {
              checksum: "checksum-1",
              contentType: "application/json",
              createdAt: now,
              id: generateId<EserviceInterfaceId>(),
              name: "Interface 1",
              path: "/interfaces/1.json",
              prettyName: "Interface 1",
              updatedAt: now,
            },
            maxDailyCallsPerConsumer: 100,
            maxDailyCallsPerKnode: 1000,
            requiredAttributes: [[generateId<AttributeId>()]],
            state: "Active",
            updatedAt: now,
            versionNumber: 1,
          },
        ],
      };
      // TODO write in event store

      return eservice;
    },
    getMockEservices(
      offset: number,
      limit: number,
    ): {
      items: { name: string }[];
      pagination: { limit: number; offset: number; total: number };
    } {
      // Mock data: 100 e-services with ids 0 to 99, with pagination support
      const eservices = new Array(100).fill(null).map((_, idx) => ({
        id: idx,
      }));

      return {
        items: eservices.slice(offset, offset + limit).map((eservice) => ({
          name: `E-service ${eservice.id}`,
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
