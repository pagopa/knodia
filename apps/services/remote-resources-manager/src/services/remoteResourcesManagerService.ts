import type { RequestContextData } from "@fastify/request-context";
import type { CorrelationId } from "@knodia/common-models/ids";

import { CORRELATION_ID_HEADER } from "@knodia/fastify-zod-api-commons/models";
import { k2kGatewayApi } from "@knodia/k2k-gateway-client";

import type {
  API_CatalogEserviceSearchResults,
  API_GetCatalogEserviceSearchParams,
  API_GetCatalogEservicesQueryParams,
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
      reqBody,
      reqQuery,
    }: {
      correlationId: CorrelationId;
      ctx: RequestContextData;
      reqBody: API_GetCatalogEserviceSearchParams;
      reqQuery: API_GetCatalogEservicesQueryParams;
    }): Promise<API_CatalogEserviceSearchResults> {
      const { logger } = ctx;
      const { knodeId, ...bodyWithoutKnodeId } = reqBody;

      logger.info(
        { query: reqQuery, requestBody: reqBody },
        `Getting E-services owned by knode ${knodeId} with query parameters and body data`,
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
