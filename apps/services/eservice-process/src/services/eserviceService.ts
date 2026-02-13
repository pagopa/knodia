import type { EserviceEventStoreWriter } from "@knodia/db-event-store-writer/eservice";
import type { ListResult } from "@knodia/db-readmodel-commons";

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
import { Eservice } from "@knodia/eservice-models";

import type {
  API_EserviceSeed,
  API_GetEservicesQueryParams,
} from "../models/api.ts";
import type { ReadmodelService } from "./readModelService.ts";

import {
  eserviceNotFound,
  invalidAttribute,
  invalidCategory,
} from "../models/errors.ts";
import { createEserviceVersionActivatedV1Event } from "../models/eserviceEventFactory.ts";
import { getLatestVersion } from "../utils/eserviceUtils.ts";
import { mockEservices } from "./mockEservices.ts";

export type EserviceService = ReturnType<typeof eserviceServiceBuilder>;

export function eserviceServiceBuilder(
  eventStoreWriter: EserviceEventStoreWriter,
  readModelService: ReadmodelService,
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
    async getEservices(
      params: API_GetEservicesQueryParams,
    ): Promise<ListResult<Eservice>> {
      return await readModelService.getEservices(params);
    },
    getMockEservice(eserviceId: EserviceId): Eservice {
      const eservices = generateMockEservices();
      const eservice = eservices.find((e) => e.id === eserviceId);

      if (!eservice) {
        throw eserviceNotFound(eserviceId);
      }

      return eservice;
    },
    getMockEserviceLatestVersion(eserviceId: EserviceId) {
      const eservices = generateMockEservices();
      const eservice = eservices.find((e) => e.id === eserviceId);

      if (!eservice) {
        throw eserviceNotFound(eserviceId);
      }

      return getLatestVersion(eservice);
    },
  };
}

function generateMockEservices(producerId?: OrganizationId): Eservice[] {
  // TODO: remove when switching to real data — fixed to keep mock output deterministic across calls
  const timestamp = new Date("2025-01-01T00:00:00.000Z");
  return mockEservices.map((mock, idx) => ({
    categories: mock.categories,
    createdAt: timestamp,
    description: { en: mock.description },
    id: `00000000-0000-4000-a000-${idx.toString(16).padStart(12, "0")}` as EserviceId,
    isConsumerOperatorIdentificationRequired: false,
    isSignalHubEnabled: false,
    mode: mock.mode,
    name: { en: mock.name },
    producerId:
      producerId ??
      (`30000000-0000-4000-a000-${idx.toString(16).padStart(12, "0")}` as OrganizationId),
    updatedAt: timestamp,
    versions: [
      {
        accessTokenAudience: ["audience-1"],
        accessTokenDuration: 3600,
        accessTokenType: "Bearer" as const,
        createdAt: timestamp,
        id: `10000000-0000-4000-a000-${idx.toString(16).padStart(12, "0")}` as EserviceVersionId,
        interfaceDocument: {
          checksum: "checksum-1",
          contentType: "application/json",
          createdAt: timestamp,
          id: `20000000-0000-4000-a000-${idx.toString(16).padStart(12, "0")}` as EserviceInterfaceId,
          name: "Interface 1",
          path: "/interfaces/1.json",
          prettyName: { en: "Interface 1" },
          updatedAt: timestamp,
        },
        maxDailyCallsPerConsumer: 100,
        maxDailyCallsPerKnode: 1000,
        requiredAttributes: [[{ code: "attr-1", scheme: "attr-scheme-1" }]],
        state: mock.state,
        updatedAt: timestamp,
        versionNumber: 1,
      },
    ],
  }));
}
