import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import {
  API_Problem,
  CORRELATION_ID_HEADER,
} from "@knodia/fastify-zod-api-commons/models";
import { remoteResourcesManagerApi } from "@knodia/remote-resources-manager-client";

import type { RemoteResourcesManagerClient } from "../clients/clientsProvider.ts";

import { apiTags } from "../models/apiTags.ts";
import {
  API_EserviceSearchParams,
  API_EserviceSearchResults,
  API_SearchEservicesQueryParams,
} from "../models/remoteResourcesManagerApi.ts";

interface RemoteResourcesManagerRouterOptions {
  remoteResourcesManagerClient: RemoteResourcesManagerClient;
}

export const remoteResourcesManagerRouter: FastifyPluginAsyncZod<
  RemoteResourcesManagerRouterOptions
> = async (fastify, { remoteResourcesManagerClient }) => {
  fastify.route({
    handler: async (req, res) => {
      const { correlationId } = getContextValues(requestContext);
      console.log(
        "🚀 ~ remoteResourcesManagerRouter ~ correlationId:",
        correlationId,
      );
      const { data } = await remoteResourcesManagerApi.searchEservices({
        body: req.body,
        client: remoteResourcesManagerClient,
        headers: {
          [CORRELATION_ID_HEADER]: correlationId,
        },
        query: req.query,
      });

      res.send(data);
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
      tags: [apiTags.remoteResourcesManager],
    },
    url: "/searchEservices",
  });
};
