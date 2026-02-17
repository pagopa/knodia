import type { EserviceEventStoreWriter } from "@knodia/db-event-store-writer/eservice";
import type {
  ListResult,
  WithMetadata,
} from "@knodia/db-readmodel-commons/models";

import { type RequestContextData } from "@fastify/request-context";
import { getAttribute } from "@knodia/attribute-models";
import { getCategory } from "@knodia/category-models";
import {
  EserviceId,
  EserviceVersionId,
  generateId,
  OrganizationId,
} from "@knodia/common-models/ids";
import { type Eservice } from "@knodia/eservice-models";

import type {
  API_EserviceSeed,
  API_GetEservicesQueryParams,
} from "../models/api.ts";
import type { ReadmodelService } from "./readmodelService.ts";

import {
  eserviceNotFound,
  eserviceVersionNotFound,
  invalidAttribute,
  invalidCategory,
} from "../models/errors.ts";
import { createEserviceVersionActivatedV1Event } from "../models/eserviceEventFactory.ts";

export type EserviceService = ReturnType<typeof eserviceServiceBuilder>;

export function eserviceServiceBuilder(
  eventStoreWriter: EserviceEventStoreWriter,
  readmodelService: ReadmodelService,
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
    async getEservice(eserviceId: EserviceId): Promise<WithMetadata<Eservice>> {
      const eservice = await readmodelService.getEservice(eserviceId);

      if (!eservice) {
        throw eserviceNotFound(eserviceId);
      }

      return eservice;
    },
    async getEserviceLatestVersion(eserviceId: EserviceId) {
      const eserviceVersion =
        await readmodelService.getEserviceLatestVersion(eserviceId);

      if (!eserviceVersion) {
        throw eserviceVersionNotFound(eserviceId);
      }

      return eserviceVersion;
    },
    async getEservices(
      params: API_GetEservicesQueryParams,
    ): Promise<ListResult<Eservice>> {
      return await readmodelService.getEservices(params);
    },
  };
}
