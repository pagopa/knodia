import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import { API_Problem } from "@knodia/fastify-zod-api-commons/models";

import type { RemoteResourcesManagerService } from "../services/remoteResourcesManagerService.ts";

import {
  API_EserviceSearchParams,
  API_EserviceSearchResults,
  API_SearchEservicesQueryParams,
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

      const eservices = await remoteResourcesManagerService.searchEservices({
        correlationId,
        reqBody: bodyWithoutKnodeId,
        reqQuery: req.query,
      });

      res.send(eservices);
    },
    method: "POST",
    schema: {
      body: API_EserviceSearchParams,
      description:
        "Search for E-Services according to search criteria and considering only E-Services with an active or suspended Version",
      operationId: "searchEservices",
      querystring: API_SearchEservicesQueryParams,
      response: {
        200: API_EserviceSearchResults.describe(
          "E-Service search results retrieved (sorted by most recently updated first)",
        ),
        400: API_Problem.describe("Bad Request"),
      },
      summary: "Search for E-Services",
      tags: [apiTags.k2kGateway],
    },
    url: "/catalog",
  });
};
