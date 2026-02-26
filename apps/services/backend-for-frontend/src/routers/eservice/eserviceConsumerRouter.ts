import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { API_EserviceIdPathParam } from "@knodia/eservice-models/api";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import { API_Problem } from "@knodia/fastify-zod-api-commons/models";
import {
  remoteResourcesManagerApi,
  type RemoteResourcesManagerClient,
} from "@knodia/remote-resources-manager-client";

import {
  API_ConsumerCatalogEserviceDetail,
  API_ConsumerCatalogEserviceSearchResults,
  API_GetConsumerCatalogEserviceDetailQueryParams,
  API_GetConsumerCatalogEserviceSearchParams,
  API_GetConsumerCatalogEservicesQueryParams,
} from "../../models/api.ts";
import {
  toAPI_ConsumerCatalogEserviceDetail,
  toAPI_ConsumerCatalogEserviceSearchResult,
} from "../../models/apiConverter.ts";
import { apiTags } from "../../models/apiTags.ts";
import { getKnodiaServiceHeaders } from "../../utils/headers.ts";

interface RemoteResourcesManagerRouterOptions {
  remoteResourcesManagerClient: RemoteResourcesManagerClient;
}

export const eserviceConsumerRouter: FastifyPluginAsyncZod<
  RemoteResourcesManagerRouterOptions
> = async (fastify, { remoteResourcesManagerClient }) => {
  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info(
        { query: req.query, requestBody: req.body },
        `Getting E-services owned by Knode ${req.body.knodeId} with query parameters and body data`,
      );

      const { data } = await remoteResourcesManagerApi.getCatalogEservices({
        body: req.body,
        client: remoteResourcesManagerClient,
        headers: getKnodiaServiceHeaders(req, correlationId),
        query: req.query,
      });

      res.send({
        pagination: data.pagination,
        results: data.results.map((r) =>
          toAPI_ConsumerCatalogEserviceSearchResult(
            r,
            Math.random() >= 0.5, // TODO: hasRequiredAttributes - implement actual check
            { en: "Producer name" }, // TODO: retrieve producer name
          ),
        ),
      });
    },
    method: "POST",
    schema: {
      body: API_GetConsumerCatalogEserviceSearchParams,
      description:
        "Search for E-services according to search criteria and considering only E-services with an active or suspended Version",
      operationId: "getConsumerCatalogEservices",
      querystring: API_GetConsumerCatalogEservicesQueryParams,
      response: {
        200: API_ConsumerCatalogEserviceSearchResults.meta({
          description:
            "E-service search results retrieved (sorted by most recently updated first)",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
      },
      summary: "Search for E-services",
      tags: [apiTags.eservice],
    },
    url: "/consumer/catalog",
  });

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info(
        { params: req.params, query: req.query },
        `Getting consumer catalog E-service detail with ID ${req.params.eserviceId}`,
      );

      const { data } = await remoteResourcesManagerApi.getCatalogEserviceDetail(
        {
          client: remoteResourcesManagerClient,
          headers: getKnodiaServiceHeaders(req, correlationId),
          path: { eserviceId: req.params.eserviceId },
          query: { knodeId: req.query.knodeId },
        },
      );

      res.send(toAPI_ConsumerCatalogEserviceDetail(data));
    },
    method: "GET",
    schema: {
      description: "Retrieve an E-service with all its details for consumers",
      operationId: "getConsumerCatalogEserviceDetail",
      params: API_EserviceIdPathParam,
      querystring: API_GetConsumerCatalogEserviceDetailQueryParams,
      response: {
        200: API_ConsumerCatalogEserviceDetail.meta({
          description: "E-service detail retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        404: API_Problem.meta({ description: "E-service not found" }),
      },
      summary: "Get consumer catalog E-service detail",
      tags: [apiTags.eservice],
    },
    url: "/consumer/catalog/:eserviceId",
  });
};
