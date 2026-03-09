import type { API_CreatedResource } from "@knodia/common-models/api";
import type { UISessionAuthData } from "@knodia/fastify-zod-api-commons/auth";
import type { AuthorizedContext } from "@knodia/fastify-zod-api-commons/context";

import { CORRELATION_ID_HEADER } from "@knodia/fastify-zod-api-commons/models";
import {
  type K2K2GatewayApiClient,
  k2kGatewayApi,
} from "@knodia/k2k-gateway-client";

import type {
  API_Agreements,
  API_AgreementSeed,
  API_GetAgreementsQueryParams,
} from "../models/agreement/api.ts";

import {
  toAPI_Agreement,
  toK2KAPI_AgreementSeed,
  toK2KAPI_AgreementState,
} from "../models/agreement/apiConverter.ts";

export type AgreementService = ReturnType<typeof agreementServiceBuilder>;

export function agreementServiceBuilder(
  k2kGatewayClient: K2K2GatewayApiClient,
) {
  return {
    async createAgreement(
      reqBody: API_AgreementSeed,
      { correlationId, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<API_CreatedResource> {
      logger.info(
        { requestBody: reqBody },
        `Creating agreement for e-service owned by Knode ${reqBody.knodeId} with body data`,
      );

      const { data } = await k2kGatewayApi.createAgreement({
        body: toK2KAPI_AgreementSeed(reqBody),
        client: k2kGatewayClient,
        headers: {
          [CORRELATION_ID_HEADER]: correlationId,
        },
      });

      // TODO: save the remote agreement in the remote resources database

      return data;
    },
    async getAgreements(
      requestQuery: API_GetAgreementsQueryParams,
      { correlationId, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<API_Agreements> {
      logger.info({ requestQuery }, "Getting Agreements with query params");

      const { data } = await k2kGatewayApi.getAgreements({
        client: k2kGatewayClient,
        headers: {
          [CORRELATION_ID_HEADER]: correlationId,
        },
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
