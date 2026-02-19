import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { API_Problem } from "@knodia/fastify-zod-api-commons/models";

import type { EserviceProcessClient } from "../clients/clientsProvider.ts";

import {
  API_CatalogEserviceSearchResults,
  API_GetCatalogEserviceSearchParams,
  API_GetCatalogEservicesQueryParams,
} from "../models/api.ts";
import { apiTags } from "../models/apiTags.ts";

interface EserviceRouterOptions {
  eserviceProcessClient: EserviceProcessClient;
}

export const eserviceRouter: FastifyPluginAsyncZod<
  EserviceRouterOptions
> = async (fastify) => {
  fastify.route({
    handler: async (req, res) => {
      // TODO: Implement actual search logic calling eserviceProcessClient
      res.send({
        pagination: {
          limit: req.query.limit,
          offset: req.query.offset,
          total: 0,
        },
        results: [],
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
        200: API_CatalogEserviceSearchResults.describe(
          "E-service search results retrieved (sorted by most recently updated first)",
        ),
        400: API_Problem.describe("Bad Request"),
      },
      summary: "Search for E-services",
      tags: [apiTags.operation],
    },
    url: "/catalog",
  });
};
