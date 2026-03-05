import type { UISessionAuthData } from "@knodia/fastify-zod-api-commons/auth";
import type { AuthorizedContext } from "@knodia/fastify-zod-api-commons/context";

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
      // TODO: use knodeId to route to the correct K2K Gateway instance
      knodeId: string,
      { correlationId, logger }: RequestContextData,
    ): Promise<API_CatalogEserviceDetail> {
      logger.info(
        { eserviceId, knodeId },
        `Getting E-service detail ${eserviceId} from Knode ${knodeId}`,
      );

      const headers = { [CORRELATION_ID_HEADER]: correlationId };
      const path = { eserviceId };

      const [{ data: eservice }, { data: version }, { data: interfaceDoc }] =
        await Promise.all([
          k2kGatewayApi.getEservice({
            client: k2kGatewayClient,
            headers,
            path,
          }),
          k2kGatewayApi.getEserviceLatestVersion({
            client: k2kGatewayClient,
            headers,
            path,
          }),
          k2kGatewayApi.getEserviceLatestVersionInterface({
            client: k2kGatewayClient,
            headers,
            path,
          }),
        ]);

      return toAPI_CatalogEserviceDetail(eservice, version, interfaceDoc);
    },

    async getCatalogEservices(
      reqBody: API_GetCatalogEserviceSearchParams,
      reqQuery: API_GetCatalogEservicesQueryParams,
      { correlationId, logger }: AuthorizedContext<UISessionAuthData>,
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
