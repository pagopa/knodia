import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { KnodeId, unsafeBrandId } from "@knodia/common-models/ids";
import { validateAuthorization } from "@knodia/fastify-zod-api-commons/auth";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import { API_Problem } from "@knodia/fastify-zod-api-commons/models";

import type { RemoteResourcesManagerService } from "../services/remoteResourcesManagerService.ts";

import {
  API_CatalogEserviceDetail,
  API_CatalogEserviceSearchResults,
  API_EserviceIdPathParam,
  API_GetCatalogEserviceDetailQueryParams,
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
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative"] },
      ]);

      const eservices = await remoteResourcesManagerService.getCatalogEservices(
        req.body,
        req.query,
        ctx,
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
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
      },
      summary: "Search for E-services",
      tags: [apiTags.k2kGateway],
    },
    url: "/catalog",
  });

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative"] },
      ]);

      const detail =
        await remoteResourcesManagerService.getCatalogEserviceDetail(
          {
            id: unsafeBrandId(req.params.eserviceId),
            knodeId: KnodeId.parse(req.query.knodeId),
          },
          ctx,
        );

      res.send(detail);
    },
    method: "GET",
    schema: {
      description: "Retrieve an E-service with all its details",
      operationId: "getCatalogEserviceDetail",
      params: API_EserviceIdPathParam,
      querystring: API_GetCatalogEserviceDetailQueryParams,
      response: {
        200: API_CatalogEserviceDetail.meta({
          description: "E-service detail retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "E-service not found" }),
      },
      summary: "Get E-service detail",
      tags: [apiTags.k2kGateway],
    },
    url: "/eservices/:eserviceId",
  });
};
