import type { EserviceEventStoreWriter } from "@knodia/db-event-store-writer/eservice";
import type { ListResult } from "@knodia/db-readmodel-commons/models";
import type {
  Eservice,
  EserviceInterface,
  EserviceVersion,
} from "@knodia/eservice-models";

import { type RequestContextData } from "@fastify/request-context";
import { getAttribute } from "@knodia/attribute-models";
import { getCategory } from "@knodia/category-models";
import {
  EserviceId,
  EserviceVersionId,
  generateId,
  OrganizationId,
  unsafeBrandId,
} from "@knodia/common-models/ids";

import type {
  API_EserviceSeed,
  API_GetCatalogEserviceSearchParams,
  API_GetCatalogEservicesQueryParams,
  API_GetEservicesQueryParams,
} from "../models/api.ts";
import type { ReadmodelService } from "./readmodelService.ts";

import {
  duplicateInterfaceId,
  eserviceNotFound,
  eserviceVersionNotFound,
  inconsistentDailyCalls,
  interfaceNotFound,
  invalidAttribute,
  invalidCategory,
} from "../models/errors.ts";
import { createEserviceVersionActivatedV1Event } from "../models/eserviceEventFactory.ts";

export type EserviceService = ReturnType<typeof eserviceServiceBuilder>;

export function eserviceServiceBuilder(
  eventStoreWriter: EserviceEventStoreWriter,
  readmodelService: ReadmodelService,
) {
  const retrieveEservice = async (eserviceId: EserviceId) => {
    const eservice = await readmodelService.getEservice(eserviceId);

    if (!eservice) {
      throw eserviceNotFound(eserviceId);
    }

    return eservice.data;
  };

  const retrieveEserviceLatestVersion = async (eserviceId: EserviceId) => {
    const eserviceVersion =
      await readmodelService.getEserviceLatestVersion(eserviceId);

    if (!eserviceVersion) {
      throw eserviceVersionNotFound(eserviceId);
    }

    return eserviceVersion;
  };

  const retrieveEserviceLatestVersionInterface = async (
    eserviceId: EserviceId,
  ) => {
    const eserviceVersionInterface =
      await readmodelService.getEserviceLatestVersionInterface(eserviceId);

    if (!eserviceVersionInterface) {
      throw interfaceNotFound(eserviceId);
    }

    return eserviceVersionInterface;
  };

  return {
    async createEservice(
      seed: API_EserviceSeed,
      { correlationId, logger }: RequestContextData,
    ): Promise<Eservice> {
      const eserviceId = generateId<EserviceId>();

      // TODO: get real producerId from auth context
      const producerId = unsafeBrandId<OrganizationId>(
        "00000000-0000-0000-0000-000000000000",
      );

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
      { logger }: RequestContextData,
    ): Promise<ListResult<Eservice>> {
      logger.info({ body, params }, "Getting catalog E-services with params");
      return await readmodelService.getCatalogEservices(body, params);
    },

    async getEservice(
      eserviceId: EserviceId,
      { logger }: RequestContextData,
    ): Promise<Eservice> {
      logger.info(`Getting E-service with ID ${eserviceId}`);

      return await retrieveEservice(eserviceId);
    },
    async getEserviceLatestVersion(
      eserviceId: EserviceId,
      { logger }: RequestContextData,
    ): Promise<Omit<EserviceVersion, "interfaceDocument">> {
      logger.info(`Getting latest version of E-service with ID ${eserviceId}`);

      return await retrieveEserviceLatestVersion(eserviceId);
    },
    async getEserviceLatestVersionInterface(
      eserviceId: EserviceId,
      { logger }: RequestContextData,
    ): Promise<EserviceInterface> {
      logger.info(
        `Getting latest version interface of E-service with ID ${eserviceId}`,
      );

      return await retrieveEserviceLatestVersionInterface(eserviceId);
    },
    async getEservices(
      params: API_GetEservicesQueryParams,
      { logger }: RequestContextData,
    ): Promise<ListResult<Eservice>> {
      logger.info({ params }, "Getting E-services with params");

      return await readmodelService.getEservices(params);
    },
  };
}
