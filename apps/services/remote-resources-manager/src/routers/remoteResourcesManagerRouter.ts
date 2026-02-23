import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import { API_Problem } from "@knodia/fastify-zod-api-commons/models";

import type { RemoteResourcesManagerService } from "../services/remoteResourcesManagerService.ts";

import {
  API_CatalogEserviceSearchResults,
  API_GetCatalogEserviceSearchParams,
  API_GetCatalogEservicesQueryParams,
} from "../models/api.ts";
import { apiTags } from "../models/apiTags.ts";

interface RemoteResourcesManagerRouterOptions {
  remoteResourcesManagerService: RemoteResourcesManagerService;
}

export const remoteResourcesManagerRouter: FastifyPluginAsyncZod<
  RemoteResourcesManagerRouterOptions
> = async (fastify, { remoteResourcesManagerService }) => {
  fastify.route({
    handler: async (req, res) => {
      const { correlationId } = getContextValues(requestContext);
      const { knodeId, ...bodyWithoutKnodeId } = req.body;
      const { limit, offset } = req.query;
      console.log(
        `Searching E-services owned by knode ${knodeId} with filters ${JSON.stringify(bodyWithoutKnodeId)} and pagination { limit: ${limit}, offset: ${offset} }`,
      );

      const eservices = await remoteResourcesManagerService.getCatalogEservices(
        {
          correlationId,
          reqBody: bodyWithoutKnodeId,
          reqQuery: req.query,
        },
      );

      res.send(eservices);
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
      tags: [apiTags.k2kGateway],
    },
    url: "/catalog",
  });
};
