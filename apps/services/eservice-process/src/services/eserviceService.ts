import type { EserviceEventStoreWriter } from "@knodia/db-event-store-writer/eservice";
import type { ListResult } from "@knodia/db-readmodel-commons";

import { type RequestContextData } from "@fastify/request-context";
import {
  EserviceId,
  EserviceVersionId,
  generateId,
  OrganizationId,
} from "@knodia/common-models/ids";
import { Eservice } from "@knodia/eservice-models";
import { zocker } from "zocker";

import type {
  API_EserviceSeed,
  API_GetProducerEservicesQueryParams,
} from "../models/api.ts";
import type { ProducerEservice } from "../models/types.ts";
import type { ReadModelService } from "./readModelService.ts";

import { createEserviceVersionActivatedV1Event } from "../models/eserviceEventFactory.ts";

export type EserviceService = ReturnType<typeof eserviceServiceBuilder>;

export function eserviceServiceBuilder(
  eventStoreWriter: EserviceEventStoreWriter,
  readModelService: ReadModelService,
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
    getMockEservices(
      offset: number,
      limit: number,
    ): {
      items: Eservice[];
      pagination: { limit: number; offset: number; total: number };
    } {
      const eservices = zocker(Eservice).generateMany(100);

      return {
        items: eservices.slice(offset, offset + limit),
        pagination: {
          limit,
          offset,
          total: eservices.length,
        },
      };
    },
    async getProducerEservices(
      params: API_GetProducerEservicesQueryParams,
      producerId: OrganizationId,
    ): Promise<ListResult<ProducerEservice>> {
      return await readModelService.getProducerEservices(params, producerId);
    },
  };
}
