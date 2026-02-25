import type { EserviceProcessClient } from "@knodia/eservice-process-client";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { eserviceProcessApi } from "@knodia/eservice-process-client";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import {
  API_Problem,
  CORRELATION_ID_HEADER,
} from "@knodia/fastify-zod-api-commons/models";

import {
  API_CatalogEserviceDetail,
  API_CatalogEserviceSearchResults,
  API_EserviceIdPathParam,
  API_GetCatalogEserviceSearchParams,
  API_GetCatalogEservicesQueryParams,
} from "../models/api.ts";
import {
  toAPI_CatalogEserviceDetail,
  toAPI_CatalogEserviceSearchResult,
} from "../models/apiConverters.ts";
import { apiTags } from "../models/apiTags.ts";

interface EserviceRouterOptions {
  eserviceProcessClient: EserviceProcessClient;
}

export const eserviceRouter: FastifyPluginAsyncZod<
  EserviceRouterOptions
> = async (fastify, { eserviceProcessClient }) => {
  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info(
        { query: req.query, requestBody: req.body },
        "Getting catalog E-services with query parameters and body data",
      );

      const headers = {
        Authorization: req.headers.authorization,
        [CORRELATION_ID_HEADER]: correlationId,
      };

      const { data } = await eserviceProcessApi.getCatalogEservices({
        body: req.body,
        client: eserviceProcessClient,
        headers,
        query: req.query,
      });

      async function enrichWithLatestVersionAndMapToAPIResult(
        eservice: eserviceProcessApi.Eservice,
      ) {
        const { data: latestVersion } =
          await eserviceProcessApi.getEserviceLatestVersion({
            client: eserviceProcessClient,
            headers,
            path: {
              eserviceId: eservice.id,
            },
          });

        return toAPI_CatalogEserviceSearchResult(eservice, latestVersion);
      }

      res.send({
        pagination: data.pagination,
        results: await Promise.all(
          data.items.map(enrichWithLatestVersionAndMapToAPIResult),
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
      tags: [apiTags.operation],
    },
    url: "/catalog",
  });

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info(
        { requestParams: req.params },
        `Getting catalog E-service detail with ID ${req.params.eserviceId}`,
      );

      const headers = {
        Authorization: req.headers.authorization,
        [CORRELATION_ID_HEADER]: correlationId,
      };

      const path = { eserviceId: req.params.eserviceId };

      const [
        { data: eservice },
        { data: latestVersion },
        { data: interfaceDocument },
      ] = await Promise.all([
        eserviceProcessApi.getEservice({
          client: eserviceProcessClient,
          headers,
          path,
        }),
        eserviceProcessApi.getEserviceLatestVersion({
          client: eserviceProcessClient,
          headers,
          path,
        }),
        eserviceProcessApi.getEserviceLatestVersionInterface({
          client: eserviceProcessClient,
          headers,
          path,
        }),
      ]);

      res.send(
        toAPI_CatalogEserviceDetail(eservice, latestVersion, interfaceDocument),
      );
    },
    method: "GET",
    schema: {
      description: "Retrieve an E-service with all its details",
      operationId: "getCatalogEserviceDetail",
      params: API_EserviceIdPathParam,
      response: {
        200: API_CatalogEserviceDetail.meta({
          description: "E-service detail retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        404: API_Problem.meta({ description: "E-service not found" }),
      },
      summary: "Get E-service detail",
      tags: [apiTags.operation],
    },
    url: "/catalog/:eserviceId",
  });
};
