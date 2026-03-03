import type { EserviceEventStoreWriter } from "@knodia/db-event-store-writer/eservice";
import type { ListResult } from "@knodia/db-readmodel-commons/models";
import type {
  Eservice,
  EserviceInterface,
  EserviceVersion,
} from "@knodia/eservice-models";
import type {
  InternalAuthData,
  UISessionAuthData,
} from "@knodia/fastify-zod-api-commons/auth";
import type { AuthorizedContext } from "@knodia/fastify-zod-api-commons/context";

import { getAttribute } from "@knodia/attribute-models";
import { getCategory } from "@knodia/category-models";
import {
  EserviceId,
  EserviceVersionId,
  generateId,
} from "@knodia/common-models/ids";
import { getTenant } from "@knodia/tenant-models";

import type {
  API_EserviceSeed,
  API_GetCatalogEserviceSearchParams,
  API_GetCatalogEservicesQueryParams,
  API_GetEservicesQueryParams,
} from "../models/api.ts";
import type { ReadmodelService } from "./readmodelService.ts";

import {
  duplicateInterfaceId,
  inconsistentDailyCalls,
  invalidAttribute,
  invalidCategory,
  tenantNotFound,
} from "../models/errors.ts";
import { createEserviceVersionActivatedV1Event } from "../models/eserviceEventFactory.ts";
import {
  retrieveEservice,
  retrieveEserviceLatestVersion,
  retrieveEserviceLatestVersionInterface,
} from "../utils/readmodelUtils.ts";

export type EserviceService = ReturnType<typeof eserviceServiceBuilder>;

export function eserviceServiceBuilder(
  eventStoreWriter: EserviceEventStoreWriter,
  readmodelService: ReadmodelService,
) {
  return {
    async createEservice(
      seed: API_EserviceSeed,
      { authData, correlationId, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<Eservice> {
      const eserviceId = generateId<EserviceId>();
      const { organizationId: producerId } = authData;

      logger.info(
        `Creating E-service ${eserviceId} for producer ${producerId}`,
      );

      if (getTenant(producerId) === undefined) {
        throw tenantNotFound(producerId);
      }

      for (const attr of seed.requiredAttributes.flat()) {
        if (getAttribute(attr) === undefined) {
          throw invalidAttribute(attr.scheme, attr.code);
        }
      }

      for (const cat of seed.categories ?? []) {
        if (getCategory(cat.scheme, cat.code) === undefined) {
          throw invalidCategory(cat.scheme, cat.code);
        }
      }

      const existingInterface =
        await readmodelService.getEserviceVersionInterfaceById(
          seed.interfaceDocument.id,
        );

      if (existingInterface) {
        throw duplicateInterfaceId(seed.interfaceDocument.id);
      }

      if (seed.maxDailyCallsPerConsumer > seed.maxDailyCallsPerKnode) {
        throw inconsistentDailyCalls();
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
    async getCatalogEservices(
      body: API_GetCatalogEserviceSearchParams,
      params: API_GetCatalogEservicesQueryParams,
      { logger }: AuthorizedContext<InternalAuthData>,
    ): Promise<ListResult<Eservice>> {
      logger.info({ body, params }, "Getting catalog E-services with params");
      return await readmodelService.getCatalogEservices(body, params);
    },

    async getEservice(
      eserviceId: EserviceId,
      { logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<Eservice> {
      logger.info(`Getting E-service with ID ${eserviceId}`);

      return await retrieveEservice(eserviceId, readmodelService);
    },
    async getEserviceLatestVersion(
      eserviceId: EserviceId,
      { logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<Omit<EserviceVersion, "interfaceDocument">> {
      logger.info(`Getting latest version of E-service with ID ${eserviceId}`);

      return await retrieveEserviceLatestVersion(eserviceId, readmodelService);
    },
    async getEserviceLatestVersionInterface(
      eserviceId: EserviceId,
      { logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<EserviceInterface> {
      logger.info(
        `Getting latest version interface of E-service with ID ${eserviceId}`,
      );

      return await retrieveEserviceLatestVersionInterface(
        eserviceId,
        readmodelService,
      );
    },
    async getEservices(
      params: API_GetEservicesQueryParams,
      { logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<ListResult<Eservice>> {
      logger.info({ params }, "Getting E-services with params");

      return await readmodelService.getEservices(params);
    },
  };
}
