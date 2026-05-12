import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { API_FileDownload } from "@knodia/common-models/api";
import { toExternalResource } from "@knodia/common-models/externalResource";
import { type EserviceId } from "@knodia/common-models/ids";
import { validateAuthorization } from "@knodia/fastify-zod-api-commons/auth";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import { sendFileDownload } from "@knodia/fastify-zod-api-commons/http";
import { API_Problem } from "@knodia/fastify-zod-api-commons/models";

import type { EserviceService } from "../services/eserviceService.ts";

import { apiTags } from "../models/apiTags.ts";
import {
  API_CatalogEserviceSearchResults,
  API_EserviceDetails,
  API_EserviceIdPathParam,
  API_Eservices,
  API_GetCatalogEserviceSearchParams,
  API_GetCatalogEservicesQueryParams,
  API_GetEserviceDetailsQueryParams,
  API_GetEservicesQueryParams,
} from "../models/eservice/api.ts";

interface EserviceRouterOptions {
  eserviceService: EserviceService;
}

export const eserviceRouter: FastifyPluginAsyncZod<
  EserviceRouterOptions
> = async (fastify, { eserviceService }) => {
  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative"] },
      ]);

      const eservices = await eserviceService.getCatalogEservices(
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
      tags: [apiTags.eservice],
    },
    url: "/catalog",
  });

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative", "technical"] },
      ]);

      const detail = await eserviceService.getEserviceDetails(
        toExternalResource<EserviceId>(
          req.params.eserviceId,
          req.query.knodeId,
        ),
        ctx,
      );

      res.send(detail);
    },
    method: "GET",
    schema: {
      description: "Retrieve an E-service with all its details",
      operationId: "getEserviceDetails",
      params: API_EserviceIdPathParam,
      querystring: API_GetEserviceDetailsQueryParams,
      response: {
        200: API_EserviceDetails.meta({
          description: "E-service detail retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "E-service not found" }),
      },
      summary: "Get E-service detail",
      tags: [apiTags.eservice],
    },
    url: "/eservices/:eserviceId",
  });

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative", "technical"] },
      ]);

      const eservices = await eserviceService.getEservices(req.query, ctx);

      res.send(eservices);
    },
    method: "GET",
    schema: {
      description: "Retrieve E-services",
      operationId: "getEservices",
      querystring: API_GetEservicesQueryParams,
      response: {
        200: API_Eservices.meta({
          description: "E-services retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Not Found" }),
      },
      summary: "Get E-services",
      tags: [apiTags.eservice],
    },
    url: "/eservices",
  });

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative", "technical"] },
      ]);

      const { buffer, contentType, fileName } =
        await eserviceService.downloadEserviceLatestVersionInterface(
          toExternalResource<EserviceId>(
            req.params.eserviceId,
            req.query.knodeId,
          ),
          ctx,
        );

      sendFileDownload(res, buffer, fileName, contentType);
    },
    method: "GET",
    schema: {
      description:
        "Download the interface document for the latest version of an E-service",
      operationId: "downloadEserviceLatestVersionInterface",
      params: API_EserviceIdPathParam,
      produces: ["application/json", "application/yaml", "application/x-yaml"],
      querystring: API_GetEserviceDetailsQueryParams,
      response: {
        200: API_FileDownload.meta({
          description: "E-service interface document downloaded successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Not Found" }),
      },
      summary: "Download E-service latest version interface",
      tags: [apiTags.eservice],
    },
    url: "/eservices/:eserviceId/interface",
  });
};
