import type { EserviceEventStoreWriter } from "@knodia/db-event-store-writer/eservice";
import type {
  API_ProducerEservices,
  API_ProducerEservicesQueryParams,
} from "@knodia/eservice-models/api";

import { type RequestContextData } from "@fastify/request-context";
import {
  EserviceId,
  EserviceInterfaceId,
  EserviceVersionId,
  generateId,
  OrganizationId,
} from "@knodia/common-models/ids";
import { Eservice } from "@knodia/eservice-models";
import { zocker } from "zocker";

import type { API_EserviceSeed } from "../models/api.ts";
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
      params: API_ProducerEservicesQueryParams,
    ): Promise<API_ProducerEservices> {
      // TODO: get real data, producerId from auth context
      const producerId = generateId<OrganizationId>();
      const { limit, offset } = params;
      const { results, totalCount } =
        await readModelService.getProducerEservices(params, producerId);

      return {
        items: results,
        pagination: {
          limit,
          offset,
          total: totalCount,
        },
      };
    },
  };
}
