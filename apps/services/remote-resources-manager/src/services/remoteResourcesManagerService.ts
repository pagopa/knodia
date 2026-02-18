import type { CorrelationId } from "@knodia/common-models/ids";

import { CORRELATION_ID_HEADER } from "@knodia/fastify-zod-api-commons/models";
import { k2kGatewayApi } from "@knodia/k2k-gateway-client";

import type {
  API_EserviceSearchParamsWithoutKnodeId,
  API_EserviceSearchResults,
  API_SearchEservicesQueryParams,
} from "../models/api.ts";

import { type K2K2GatewayApiClient } from "../clients/clientsProvider.ts";

export type RemoteResourcesManagerService = ReturnType<
  typeof remoteResourcesManagerServiceBuilder
>;

export function remoteResourcesManagerServiceBuilder(
  k2kGatewayClient: K2K2GatewayApiClient,
) {
  return {
    async searchEservices({
      correlationId,
      reqBody,
      reqQuery,
    }: {
      correlationId: CorrelationId;
      reqBody: API_EserviceSearchParamsWithoutKnodeId;
      reqQuery: API_SearchEservicesQueryParams;
    }): Promise<API_EserviceSearchResults> {
      const { data } = await k2kGatewayApi.searchEservices({
        body: reqBody,
        client: k2kGatewayClient,
        headers: {
          [CORRELATION_ID_HEADER]: correlationId,
        },
        query: reqQuery,
      });

      return data;
    },
  };
}
