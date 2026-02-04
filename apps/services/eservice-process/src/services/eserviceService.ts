import type { EserviceEventStoreWriter } from "@knodia/db-event-store-writer/eservice";

import { type RequestContextData } from "@fastify/request-context";
import {
  EserviceId,
  EserviceInterfaceId,
  EserviceVersionId,
  generateId,
  OrganizationId,
} from "@knodia/common-models/ids";
import { deriveEserviceStatus, Eservice } from "@knodia/eservice-models";

import type {
  API_EserviceSeed,
  API_ProducerEservicesQueryParams,
} from "../models/api.ts";

import { createEserviceVersionActivatedV1Event } from "../models/eserviceEventFactory.ts";
import { mockEservices } from "./mockEservices.ts";

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
    getMockEservices(
      offset: number,
      limit: number,
    ): {
      items: Eservice[];
      pagination: { limit: number; offset: number; total: number };
    } {
      const eservices = generateMockEservices();

      return {
        items: eservices.slice(offset, offset + limit),
        pagination: {
          limit,
          offset,
          total: eservices.length,
        },
      };
    },
    getProducerEservices(params: API_ProducerEservicesQueryParams): {
      items: {
        activeAgreements: number;
        activePurposes: number;
        eservice: Eservice;
      }[];
      pagination: { limit: number; offset: number; total: number };
    } {
      // TODO: get real data, producerId from auth context
      const producerId = generateId<OrganizationId>();
      const eservices = generateMockEservices(producerId);
      const { limit, mode, offset, q, status } = params;

      // Enrich with random mock counts
      let items = eservices.map((eservice) => ({
        ...generateMockCounts(),
        eservice,
      }));

      // Filter by search query (name, description, categories)
      if (q) {
        const query = q.toLowerCase();
        items = items.filter(
          (item) =>
            item.eservice.name.en.toLowerCase().includes(query) ||
            item.eservice.description.en.toLowerCase().includes(query) ||
            item.eservice.categories.some((c) =>
              c.code.toLowerCase().includes(query),
            ),
        );
      }

      // Filter by status
      if (status && status.length > 0) {
        items = items.filter((item) =>
          status.includes(deriveEserviceStatus(item.eservice)),
        );
      }

      // Filter by mode
      if (mode) {
        items = items.filter((item) => item.eservice.mode === mode);
      }

      // Sort
      const sortBy = params.sortBy ?? "name";
      const sortOrder = params.sortOrder ?? "asc";
      const direction = sortOrder === "asc" ? 1 : -1;

      items.sort((a, b) => {
        switch (sortBy) {
          case "activeAgreements":
            return (a.activeAgreements - b.activeAgreements) * direction;
          case "activePurposes":
            return (a.activePurposes - b.activePurposes) * direction;
          case "name":
          default:
            return (
              a.eservice.name.en.localeCompare(b.eservice.name.en) * direction
            );
        }
      });

      // Paginate (after filtering and sorting)
      const total = items.length;
      const paginatedItems = items.slice(offset, offset + limit);

      return {
        items: paginatedItems,
        pagination: {
          limit,
          offset,
          total,
        },
      };
    },
  };
}

function generateMockCounts(): {
  activeAgreements: number;
  activePurposes: number;
} {
  return {
    activeAgreements: Math.floor(Math.random() * 500),
    activePurposes: Math.floor(Math.random() * 1000),
  };
}

function generateMockEservices(sharedProducerId?: OrganizationId): Eservice[] {
  const now = new Date();

  return mockEservices.map((mock) => ({
    categories: mock.categories,
    createdAt: now,
    description: { en: mock.description },
    id: generateId<EserviceId>(),
    isConsumerOperatorIdentificationRequired: false,
    isSignalHubEnabled: false,
    mode: mock.mode,
    name: { en: mock.name },
    producerId: sharedProducerId ?? generateId<OrganizationId>(),
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
        state: mock.state,
        updatedAt: now,
        versionNumber: 1,
      },
    ],
  }));
}
