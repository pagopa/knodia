import type { RequestContextData } from "@fastify/request-context";
import type { CorrelationId } from "@knodia/common-models/ids";

import { CORRELATION_ID_HEADER } from "@knodia/fastify-zod-api-commons/models";
import { k2kGatewayApi } from "@knodia/k2k-gateway-client";

import type {
  API_CatalogEserviceSearchResults,
  API_GetCatalogEservicesQueryParams,
  API_GetEserviceSearchParamsWithoutKnodeId,
} from "../models/api.ts";

import { type K2K2GatewayApiClient } from "../clients/clientsProvider.ts";
import { toAPI_CatalogEserviceSearchResult } from "../models/apiConverter.ts";

export type RemoteResourcesManagerService = ReturnType<
  typeof remoteResourcesManagerServiceBuilder
>;

export function remoteResourcesManagerServiceBuilder(
  k2kGatewayClient: K2K2GatewayApiClient,
) {
  return {
    async getCatalogEservices({
      correlationId,
      ctx,
      knodeId,
      reqBody,
      reqQuery,
    }: {
      correlationId: CorrelationId;
      ctx: RequestContextData;
      knodeId: string; // TODO: update with branded id
      reqBody: API_GetEserviceSearchParamsWithoutKnodeId;
      reqQuery: API_GetCatalogEservicesQueryParams;
    }): Promise<API_CatalogEserviceSearchResults> {
      const { logger } = ctx;

      logger.info(
        { query: reqQuery, requestBody: reqBody },
        `Getting E-services owned by knode ${knodeId} with query parameters and body data`,
      );

      const { data } = await k2kGatewayApi.getCatalogEservices({
        body: reqBody,
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
