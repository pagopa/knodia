import type { CorrelationId } from "@knodia/common-models/ids";

import { apiGatewayApi } from "@knodia/api-gateway-client";
import { CORRELATION_ID_HEADER } from "@knodia/fastify-zod-api-commons/models";

import type {
  API_EserviceSearchParams,
  API_EserviceSearchResults,
  API_SearchEservicesQueryParams,
} from "../models/api.ts";

import { type ApiGatewayClient } from "../clients/clientsProvider.ts";

export type RemoteResourcesManagerService = ReturnType<
  typeof remoteResourcesManagerServiceBuilder
>;

export function remoteResourcesManagerServiceBuilder(
  apiGatewayClient: ApiGatewayClient,
) {
  return {
    async searchEservices({
      correlationId,
      reqBody,
      reqQuery,
    }: {
      correlationId: CorrelationId;
      reqBody: API_EserviceSearchParams;
      reqQuery: API_SearchEservicesQueryParams;
    }): Promise<API_EserviceSearchResults> {
      const { data } = await apiGatewayApi.searchEservices({
        body: reqBody,
        client: apiGatewayClient,
        headers: {
          [CORRELATION_ID_HEADER]: correlationId,
        },
        query: reqQuery,
      });

      return data;
    },
  };
}
