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
import {
  fromAPI_AccessTokenType,
  fromAPI_EserviceMode,
  fromAPI_EserviceVersionState,
} from "@knodia/eservice-models/apiConverters";

import type {
  API_EserviceSeed,
  API_GetEservicesQueryParams,
} from "../models/api.ts";
import type { ReadmodelService } from "./readmodelService.ts";

import {
  duplicateInterfaceId,
  eserviceNotFound,
  eserviceVersionNotFound,
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

      const existingInterface =
        await readmodelService.getEserviceVersionInterfaceById(
          seed.interfaceDocument.id,
        );
      if (existingInterface) {
        throw duplicateInterfaceId(seed.interfaceDocument.id);
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
        mode: seed.mode ? fromAPI_EserviceMode(seed.mode) : "ProvideData",
        name: seed.name,
        producerId,
        updatedAt: now,
        versions: [
          {
            accessTokenAudience: seed.accessTokenAudience,
            accessTokenDuration: seed.accessTokenDuration ?? 3600,
            accessTokenType: seed.accessTokenType
              ? fromAPI_AccessTokenType(seed.accessTokenType)
              : "Bearer",
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
    async getEservice(eserviceId: EserviceId): Promise<Eservice> {
      return await retrieveEservice(eserviceId);
    },
    async getEserviceLatestVersion(
      eserviceId: EserviceId,
    ): Promise<Omit<EserviceVersion, "interfaceDocument">> {
      return await retrieveEserviceLatestVersion(eserviceId);
    },
    async getEserviceLatestVersionInterface(
      eserviceId: EserviceId,
    ): Promise<EserviceInterface> {
      return await retrieveEserviceLatestVersionInterface(eserviceId);
    },
    async getEservices(
      params: API_GetEservicesQueryParams,
    ): Promise<ListResult<Eservice>> {
      return await readmodelService.getEservices({
        ...params,
        mode: params.mode ? fromAPI_EserviceMode(params.mode) : undefined,
        producerId: params.producerId
          ? unsafeBrandId<OrganizationId>(params.producerId)
          : undefined,
        state: params.state
          ? params.state.map(fromAPI_EserviceVersionState)
          : undefined,
      });
    },
  };
}
