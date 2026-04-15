import type { ExternalId } from "@knodia/common-models/externalResource";
import type { KnodeId, PurposeId } from "@knodia/common-models/ids";
import type { RemoteResourceDbService } from "@knodia/db-remote-resource/services";
import type { UISessionAuthData } from "@knodia/fastify-zod-api-commons/auth";
import type { AuthorizedContext } from "@knodia/fastify-zod-api-commons/context";

import {
  type K2K2GatewayApiClient,
  k2kGatewayApi,
} from "@knodia/k2k-gateway-client";

import type {
  API_CreatedPurposeResource,
  API_GetPurposesQueryParams,
  API_Purpose,
  API_Purposes,
  API_PurposeSeed,
} from "../models/purpose/api.ts";
import type { ReadmodelService } from "./readmodelService.ts";

import { purposeNotFound } from "../models/errors.ts";
import { toAPI_Purpose } from "../models/purpose/apiConverter.ts";
import { retrieveOrganization } from "../utils/readmodelUtils.ts";

export type PurposeService = ReturnType<typeof purposeServiceBuilder>;

export function purposeServiceBuilder(
  k2kGatewayClient: K2K2GatewayApiClient,
  remoteResourceDbService: RemoteResourceDbService,
  readmodelService: ReadmodelService,
) {
  return {
    async createPurpose(
      reqBody: API_PurposeSeed,
      { authData, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<API_CreatedPurposeResource> {
      const {
        dailyCalls,
        description,
        eserviceId,
        formAnswersJson,
        formSchemaVersion,
        knodeId,
        name,
      } = reqBody;
      const { organizationId: consumerId } = authData;

      logger.info(
        { requestBody: reqBody },
        `Creating purpose for e-service owned by Knode ${knodeId} with body data`,
      );

      await retrieveOrganization(consumerId, readmodelService);

      const { data } = await k2kGatewayApi.createPurpose({
        body: {
          consumerId,
          dailyCalls,
          description,
          eserviceId,
          formAnswersJson,
          formSchemaVersion,
          name,
        },
        client: k2kGatewayClient,
      });

      await remoteResourceDbService.insertPurpose({
        consumerId,
        eserviceId,
        knodeId,
        purposeId: data.id,
      });

      return data;
    },
    async getCurrentPurposeFormSchemas(
      knodeId: KnodeId,
      { logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<{
      schema: Record<string, unknown>;
      texts: { en: Record<string, string> };
      uiSchema: Record<string, unknown>;
      version: string;
    }> {
      logger.info(`Getting current Purpose form schemas from Knode ${knodeId}`);
      const { data } = await k2kGatewayApi.getCurrentPurposeFormSchemas({
        client: k2kGatewayClient,
      });
      return data;
    },
    async getPurpose(
      {
        knodeId,
        purposeId,
      }: {
        knodeId: KnodeId;
        purposeId: ExternalId<PurposeId>;
      },
      { logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<API_Purpose> {
      logger.info(`Getting Purpose ${purposeId} from Knode ${knodeId}`);

      const remotePurpose = await remoteResourceDbService.getPurposeById(
        purposeId,
        knodeId,
      );

      if (!remotePurpose) {
        throw purposeNotFound(purposeId);
      }

      const { data } = await k2kGatewayApi.getPurpose({
        client: k2kGatewayClient,
        path: { purposeId },
      });

      return toAPI_Purpose(data, knodeId);
    },

    async getPurposes(
      requestQuery: API_GetPurposesQueryParams,
      { authData, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<API_Purposes> {
      logger.info({ requestQuery }, "Getting Purposes with query params");

      const { eserviceId, limit, offset } = requestQuery;
      const consumerId = authData.organizationId;

      // TODO: when eserviceId is provided, query only the knode that produces
      // that e-service instead of iterating over all knodes
      const knodesWithPurposes =
        await remoteResourceDbService.getPurposesDistinctKnodes(consumerId);

      let totalCount = 0;
      let dynamicLimit = limit;
      let dynamicOffset = offset;
      let results: API_Purpose[] = [];

      for (const knodeId of knodesWithPurposes) {
        logger.info(
          `Getting Purposes from Knode ${knodeId} for consumer ${consumerId}`,
        );

        const { data } = await k2kGatewayApi.getPurposes({
          client: k2kGatewayClient,
          query: {
            consumerId,
            eserviceId,
            limit: dynamicLimit,
            offset: dynamicOffset,
          },
        });

        if (results.length < limit) {
          results = results.concat(
            data.results.map((purpose) => toAPI_Purpose(purpose, knodeId)),
          );
          dynamicLimit = limit - results.length;
          dynamicOffset = 0;
        }

        totalCount += data.pagination.total;
      }

      return {
        pagination: {
          limit,
          offset,
          total: totalCount,
        },
        results,
      };
    },
  };
}
