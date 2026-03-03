import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { API_FileDownload } from "@knodia/common-models/api";
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
      const eservices = await remoteResourcesManagerService.getCatalogEservices(
        req.body,
        req.query,
        getContextValues(requestContext),
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

  fastify.route({
    handler: async (req, res) => {
      const detail =
        await remoteResourcesManagerService.getCatalogEserviceDetail(
          req.params.eserviceId,
          req.query.knodeId,
          getContextValues(requestContext),
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
        404: API_Problem.meta({ description: "E-service not found" }),
      },
      summary: "Get E-service detail",
      tags: [apiTags.k2kGateway],
    },
    url: "/eservices/:eserviceId",
  });

  fastify.route({
    handler: async (req, res) => {
      const { buffer, contentType, fileName } =
        await remoteResourcesManagerService.downloadEserviceLatestVersionInterface(
          req.params.eserviceId,
          req.query.knodeId,
          getContextValues(requestContext),
        );

      res.raw.writeHead(200, {
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Type": contentType,
      });
      res.raw.end(buffer);
    },
    method: "GET",
    schema: {
      description:
        "Download the interface document for the latest version of an E-service",
      operationId: "downloadEserviceLatestVersionInterface",
      params: API_EserviceIdPathParam,
      produces: ["application/octet-stream"],
      querystring: API_GetCatalogEserviceDetailQueryParams,
      response: {
        200: API_FileDownload.meta({
          description: "E-service interface document downloaded successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        404: API_Problem.meta({ description: "Not Found" }),
      },
      summary: "Download E-service latest version interface",
      tags: [apiTags.k2kGateway],
    },
    url: "/eservices/:eserviceId/interface",
  });
};
