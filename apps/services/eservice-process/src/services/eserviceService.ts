import type { EserviceEventStoreWriter } from "@knodia/db-event-store-writer/eservice";

import { type RequestContextData } from "@fastify/request-context";
import { getAttribute } from "@knodia/attribute-models";
import { getCategory } from "@knodia/category-models";
import {
  EserviceId,
  EserviceInterfaceId,
  EserviceVersionId,
  generateId,
  OrganizationId,
} from "@knodia/common-models/ids";
import { Eservice, getLatestVersion } from "@knodia/eservice-models";

import type {
  API_EserviceSeed,
  API_EservicesQueryParams,
} from "../models/api.ts";

import { invalidAttribute, invalidCategory } from "../models/errors.ts";
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
            interfaceDocument: {
              checksum: seed.interfaceDocument.checksum,
              contentType: seed.interfaceDocument.contentType,
              createdAt: now,
              id: seed.interfaceDocument.id,
              name: seed.interfaceDocument.name,
              path: seed.interfaceDocument.path,
              prettyName: seed.interfaceDocument.prettyName,
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
    getMockEservices(params: API_EservicesQueryParams): {
      items: Eservice[];
      pagination: { limit: number; offset: number; total: number };
    } {
      const { limit, mode, offset, producerId, q, sortOrder, status } = params;

      // TODO: replace mock data, filtering, and sorting with real database queries (read model)
      let eservices = generateMockEservices(producerId);

      // Filter by producerId
      if (producerId) {
        eservices = eservices.filter((e) => e.producerId === producerId);
      }

      // Filter by search query (name, description, categories)
      // TODO: currently hardcoded to .en, should filter by the user's current language
      if (q) {
        const query = q.toLowerCase();
        eservices = eservices.filter(
          (e) =>
            e.name.en.toLowerCase().includes(query) ||
            e.description.en.toLowerCase().includes(query) ||
            // TODO: filter by category name instead of code when using real data
            e.categories.some((c) => c.code.toLowerCase().includes(query)),
        );
      }

      // Filter by status
      if (status && status.length > 0) {
        eservices = eservices.filter((e) =>
          status.includes(getLatestVersion(e).state),
        );
      }

      // Filter by mode
      if (mode) {
        eservices = eservices.filter((e) => e.mode === mode);
      }

      // Sort by name (the only supported sort field)
      // TODO: currently hardcoded to .en, should sort by the user's current language
      const direction = sortOrder === "asc" ? 1 : -1;
      eservices.sort((a, b) => a.name.en.localeCompare(b.name.en) * direction);

      // Paginate
      const total = eservices.length;
      const paginatedItems = eservices.slice(offset, offset + limit);

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

function generateMockEservices(producerId?: OrganizationId): Eservice[] {
  const now = new Date();

  return mockEservices.map((mock, idx) => ({
    categories: mock.categories,
    createdAt: now,
    description: { en: mock.description },
    id: `00000000-0000-4000-a000-${idx.toString(16).padStart(12, "0")}` as EserviceId,
    isConsumerOperatorIdentificationRequired: false,
    isSignalHubEnabled: false,
    mode: mock.mode,
    name: { en: mock.name },
    producerId: producerId ?? generateId<OrganizationId>(),
    updatedAt: now,
    versions: [
      {
        accessTokenAudience: ["audience-1"],
        accessTokenDuration: 3600,
        accessTokenType: "Bearer" as const,
        createdAt: now,
        id: `10000000-0000-4000-a000-${idx.toString(16).padStart(12, "0")}` as EserviceVersionId,
        interfaceDocument: {
          checksum: "checksum-1",
          contentType: "application/json",
          createdAt: now,
          id: `20000000-0000-4000-a000-${idx.toString(16).padStart(12, "0")}` as EserviceInterfaceId,
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
