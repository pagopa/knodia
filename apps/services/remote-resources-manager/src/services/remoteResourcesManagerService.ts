import type { RequestContextData } from "@fastify/request-context";

import { CORRELATION_ID_HEADER } from "@knodia/fastify-zod-api-commons/models";
import {
  type K2K2GatewayApiClient,
  k2kGatewayApi,
} from "@knodia/k2k-gateway-client";

import type {
  API_CatalogEserviceDetail,
  API_CatalogEserviceSearchResults,
  API_GetCatalogEserviceSearchParams,
  API_GetCatalogEservicesQueryParams,
} from "../models/api.ts";

import {
  toAPI_CatalogEserviceDetail,
  toAPI_CatalogEserviceSearchResult,
} from "../models/apiConverter.ts";

export type RemoteResourcesManagerService = ReturnType<
  typeof remoteResourcesManagerServiceBuilder
>;

export function remoteResourcesManagerServiceBuilder(
  k2kGatewayClient: K2K2GatewayApiClient,
) {
  return {
    async getCatalogEserviceDetail(
      eserviceId: string,
      knodeId: string,
      { correlationId, logger }: RequestContextData,
    ): Promise<API_CatalogEserviceDetail> {
      logger.info(
        { eserviceId, knodeId },
        `Getting E-service detail ${eserviceId} from Knode ${knodeId}`,
      );

      const { data } = await k2kGatewayApi.getCatalogEserviceDetail({
        client: k2kGatewayClient,
        headers: {
          [CORRELATION_ID_HEADER]: correlationId,
        },
        path: { eserviceId },
      });

      return toAPI_CatalogEserviceDetail(data);
    },

    async getCatalogEservices(
      reqBody: API_GetCatalogEserviceSearchParams,
      reqQuery: API_GetCatalogEservicesQueryParams,
      { correlationId, logger }: RequestContextData,
    ): Promise<API_CatalogEserviceSearchResults> {
      const { knodeId, ...bodyWithoutKnodeId } = reqBody;

      logger.info(
        { query: reqQuery, requestBody: reqBody },
        `Getting E-services owned by Knode ${knodeId} with query parameters and body data`,
      );

      const { data } = await k2kGatewayApi.getCatalogEservices({
        body: bodyWithoutKnodeId,
        client: k2kGatewayClient,
        headers: {
          [CORRELATION_ID_HEADER]: correlationId,
        },
        query: reqQuery,
      });

      return {
        pagination: data.pagination,
        results: data.results.map(toAPI_CatalogEserviceSearchResult),
      };
    },
  };
}
