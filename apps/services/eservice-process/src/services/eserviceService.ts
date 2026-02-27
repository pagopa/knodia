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
import { genericInternalError } from "@knodia/common-models/errors";
import {
  EserviceId,
  EserviceVersionId,
  generateId,
  type OrganizationId,
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
  eserviceNotFound,
  eserviceVersionNotFound,
  inconsistentDailyCalls,
  interfaceNotFound,
  invalidAttribute,
  invalidCategory,
  tenantNotFound,
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
      contextData: RequestContextData,
    ): Promise<Eservice> {
      const producerId = getProducerId(contextData);
      const { correlationId, logger } = contextData;
      const eserviceId = generateId<EserviceId>();

      logger.info(
        `Creating E-service ${eserviceId} for producer ${producerId}`,
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
      contextData: RequestContextData,
    ): Promise<Eservice> {
      const producerId = getProducerId(contextData);
      contextData.logger.info(
        `Getting E-service ${eserviceId} for producer ${producerId}`,
      );

      return await retrieveEservice(eserviceId);
    },
    async getEserviceLatestVersion(
      eserviceId: EserviceId,
      contextData: RequestContextData,
    ): Promise<Omit<EserviceVersion, "interfaceDocument">> {
      const producerId = getProducerId(contextData);
      contextData.logger.info(
        `Getting latest version of E-service ${eserviceId} for producer ${producerId}`,
      );

      return await retrieveEserviceLatestVersion(eserviceId);
    },
    async getEserviceLatestVersionInterface(
      eserviceId: EserviceId,
      contextData: RequestContextData,
    ): Promise<EserviceInterface> {
      const producerId = getProducerId(contextData);
      contextData.logger.info(
        `Getting latest version interface of E-service ${eserviceId} for producer ${producerId}`,
      );

      return await retrieveEserviceLatestVersionInterface(eserviceId);
    },
    async getEservices(
      params: API_GetEservicesQueryParams,
      contextData: RequestContextData,
    ): Promise<ListResult<Eservice>> {
      const producerId = getProducerId(contextData);
      contextData.logger.info({ params, producerId }, "Getting E-services");

      return await readmodelService.getEservices({ ...params, producerId });
    },
  };
}

function assertTenantExists(organizationId: OrganizationId): void {
  if (!getTenant(organizationId)) {
    throw tenantNotFound(organizationId);
  }
}

function getProducerId({ authData }: RequestContextData): OrganizationId {
  if (authData?.tokenType !== "ui-session") {
    throw genericInternalError("Expected UI session authentication");
  }
  assertTenantExists(authData.organizationId);
  return authData.organizationId;
}
