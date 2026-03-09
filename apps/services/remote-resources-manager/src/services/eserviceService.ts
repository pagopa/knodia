import type { ExternalResource } from "@knodia/common-models/externalResource";
import type { EserviceId } from "@knodia/common-models/ids";
import type { UISessionAuthData } from "@knodia/fastify-zod-api-commons/auth";
import type { AuthorizedContext } from "@knodia/fastify-zod-api-commons/context";

import { CORRELATION_ID_HEADER } from "@knodia/fastify-zod-api-commons/models";
import {
  type K2K2GatewayApiClient,
  k2kGatewayApi,
} from "@knodia/k2k-gateway-client";

import type {
  API_CatalogEserviceSearchResults,
  API_EserviceDetails,
  API_GetCatalogEserviceSearchParams,
  API_GetCatalogEservicesQueryParams,
} from "../models/eservice/api.ts";

import {
  toAPI_CatalogEserviceSearchResult,
  toAPI_EserviceDetails,
} from "../models/eservice/apiConverter.ts";

export type EserviceService = ReturnType<typeof eserviceServiceBuilder>;

export function eserviceServiceBuilder(k2kGatewayClient: K2K2GatewayApiClient) {
  return {
    async getCatalogEservices(
      reqBody: API_GetCatalogEserviceSearchParams,
      reqQuery: API_GetCatalogEservicesQueryParams,
      { correlationId, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<API_CatalogEserviceSearchResults> {
      const { knodeId, ...bodyWithoutKnodeId } = reqBody;

      logger.info(
        { requestBody: reqBody, requestQuery: reqQuery },
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

    async getEserviceDetails(
      eserviceId: ExternalResource<EserviceId>,
      { correlationId, logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<API_EserviceDetails> {
      logger.info(
        { eserviceId: eserviceId.id, knodeId: eserviceId.knodeId },
        `Getting E-service detail ${eserviceId.id} from Knode ${eserviceId.knodeId}`,
      );

      const headers = { [CORRELATION_ID_HEADER]: correlationId };
      const path = { eserviceId: eserviceId.id };

      const [{ data: eservice }, { data: version }] = await Promise.all([
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
      ]);

      return toAPI_EserviceDetails(eservice, version);
    },
  };
}
