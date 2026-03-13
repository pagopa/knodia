import type { RemoteResourceDbService } from "@knodia/db-remote-resource/services";
import type { UISessionAuthData } from "@knodia/fastify-zod-api-commons/auth";
import type { AuthorizedContext } from "@knodia/fastify-zod-api-commons/context";

import {
  type K2K2GatewayApiClient,
  k2kGatewayApi,
} from "@knodia/k2k-gateway-client";

import type {
  API_Agreements,
  API_AgreementSeed,
  API_CreatedAgreementResource,
  API_GetAgreementsQueryParams,
} from "../models/agreement/api.ts";

import {
  toAPI_Agreement,
  toK2KAPI_AgreementState,
} from "../models/agreement/apiConverter.ts";

export type AgreementService = ReturnType<typeof agreementServiceBuilder>;

export function agreementServiceBuilder(
  k2kGatewayClient: K2K2GatewayApiClient,

  remoteResourceDbService: RemoteResourceDbService,
) {
  return {
    async createAgreement(
      reqBody: API_AgreementSeed,
      { logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<API_CreatedAgreementResource> {
      const { consumerId, eserviceId, eserviceVersionId, knodeId } = reqBody;

      logger.info(
        { requestBody: reqBody },
        `Creating agreement for e-service owned by Knode ${knodeId} with body data`,
      );

      // TODO: add assertOrganizationExists(consumerId) to check if the seed consumerId exists before calling the K2K Gateway API

      const { data } = await k2kGatewayApi.createAgreement({
        body: {
          consumerId,
          eserviceId,
          eserviceVersionId,
        },
        client: k2kGatewayClient,
      });

      await remoteResourceDbService.insertAgreement({
        agreementId: data.id,
        consumerId,
        eserviceId,
        eserviceVersionId,
        knodeId,
        producerId: data.producerId,
      });

      return data;
    },
    async getAgreements(
      requestQuery: API_GetAgreementsQueryParams,
      { logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<API_Agreements> {
      logger.info({ requestQuery }, "Getting Agreements with query params");

      const { data } = await k2kGatewayApi.getAgreements({
        client: k2kGatewayClient,
        query: {
          consumerId: requestQuery.consumerId,
          limit: requestQuery.limit,
          offset: requestQuery.offset,
          state: requestQuery.state
            ? toK2KAPI_AgreementState(requestQuery.state)
            : undefined,
        },
      });

      return {
        pagination: data.pagination,
        results: data.results.map(toAPI_Agreement),
      };
    },
  };
}
