import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { eserviceProcessApi } from "@knodia/eservice-process-client";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import {
  API_Problem,
  CORRELATION_ID_HEADER,
} from "@knodia/fastify-zod-api-commons/models";

import type { EserviceProcessClient } from "../clients/clientsProvider.ts";

import {
  API_CatalogEserviceSearchResults,
  API_GetCatalogEserviceSearchParams,
  API_GetCatalogEservicesQueryParams,
} from "../models/api.ts";
import { toAPI_CatalogEserviceSearchResult } from "../models/apiConverters.ts";
import { apiTags } from "../models/apiTags.ts";

interface EserviceRouterOptions {
  eserviceProcessClient: EserviceProcessClient;
}

export const eserviceRouter: FastifyPluginAsyncZod<
  EserviceRouterOptions
> = async (fastify, { eserviceProcessClient }) => {
  fastify.route({
    handler: async (req, res) => {
      const { correlationId } = getContextValues(requestContext);

      const headers = {
        [CORRELATION_ID_HEADER]: correlationId,
      };

      const { data } = await eserviceProcessApi.getEservices({
        client: eserviceProcessClient,
        headers,
        query: {
          limit: req.query.limit,
          offset: req.query.offset,
        },
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
        "Search for E-Services according to search criteria and considering only E-Services with an active or suspended Version",
      operationId: "getCatalogEservices",
      querystring: API_GetCatalogEservicesQueryParams,
      response: {
        200: API_CatalogEserviceSearchResults.describe(
          "E-Service search results retrieved (sorted by most recently updated first)",
        ),
        400: API_Problem.describe("Bad Request"),
      },
      summary: "Search for E-Services",
      tags: [apiTags.operations],
    },
    url: "/catalog",
  });
};
