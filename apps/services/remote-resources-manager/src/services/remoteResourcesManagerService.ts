import type { CorrelationId } from "@knodia/common-models/ids";

import { CORRELATION_ID_HEADER } from "@knodia/fastify-zod-api-commons/models";
import { knodiaApiGatewayApi } from "@knodia/knodia-api-gateway-client";

import type {
  API_EserviceSearchParams,
  API_EserviceSearchResults,
  API_SearchEservicesQueryParams,
} from "../models/api.ts";

import { type KnodiaApiGatewayClient } from "../clients/clientsProvider.ts";

export type RemoteResourcesManagerService = ReturnType<
  typeof remoteResourcesManagerServiceBuilder
>;

export function remoteResourcesManagerServiceBuilder(
  knodiaApiGatewayClient: KnodiaApiGatewayClient,
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
      const { data } = await knodiaApiGatewayApi.searchEservices({
        body: reqBody,
        client: knodiaApiGatewayClient,
        headers: {
          [CORRELATION_ID_HEADER]: correlationId,
        },
        query: reqQuery,
      });

      return data;
    },
  };
}
