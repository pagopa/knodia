import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import {
  API_Problem,
  CORRELATION_ID_HEADER,
} from "@knodia/fastify-zod-api-commons/models";
import { remoteResourcesManagerApi } from "@knodia/remote-resources-manager-client";

import type { RemoteResourcesManagerClient } from "../clients/clientsProvider.ts";

import { toAPI_CatalogEserviceSearchResult } from "../models/apiConverter.ts";
import { apiTags } from "../models/apiTags.ts";
import {
  API_CatalogEserviceSearchResults,
  API_GetCatalogEserviceSearchParams,
  API_GetCatalogEservicesQueryParams,
} from "../models/remoteResourcesManagerApi.ts";

interface RemoteResourcesManagerRouterOptions {
  remoteResourcesManagerClient: RemoteResourcesManagerClient;
}

export const remoteResourcesManagerRouter: FastifyPluginAsyncZod<
  RemoteResourcesManagerRouterOptions
> = async (fastify, { remoteResourcesManagerClient }) => {
  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info(
        { query: req.query, requestBody: req.body },
        `Getting E-services owned by knode ${req.body.knodeId} with query parameters and body data`,
      );

      const { data } = await remoteResourcesManagerApi.getCatalogEservices({
        body: req.body,
        client: remoteResourcesManagerClient,
        headers: {
          [CORRELATION_ID_HEADER]: correlationId,
        },
        query: req.query,
      });

      res.send({
        pagination: data.pagination,
        results: data.results.map((r) =>
          toAPI_CatalogEserviceSearchResult(r, {
            en: "Producer name", // TODO: retrieve producer name
          }),
        ),
      });
    },
    method: "POST",
    schema: {
      body: API_GetCatalogEserviceSearchParams,
      description:
        "Search for E-services according to search criteria and considering only E-services with an active or suspended Version",
      operationId: "getCatalogEservices",
      querystring: API_GetCatalogEservicesQueryParams,
      response: {
        200: API_CatalogEserviceSearchResults.meta({
          description:
            "E-service search results retrieved (sorted by most recently updated first)",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
      },
      summary: "Search for E-services",
      tags: [apiTags.remoteResourcesManager],
    },
    url: "/catalog",
  });
};
