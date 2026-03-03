import type { EserviceProcessClient } from "@knodia/eservice-process-client";
import type { RefreshableInternalTokenGenerator } from "@knodia/token-generator/refreshable";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { eserviceProcessApi } from "@knodia/eservice-process-client";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import { API_Problem } from "@knodia/fastify-zod-api-commons/models";

import {
  API_CatalogEserviceSearchResults,
  API_Eservice,
  API_EserviceIdPathParam,
  API_EserviceVersion,
  API_EserviceVersionInterfaceDocument,
  API_FileDownload,
  API_GetCatalogEserviceSearchParams,
  API_GetCatalogEservicesQueryParams,
} from "../models/api.ts";
import {
  toAPI_CatalogEserviceSearchResult,
  toAPI_Eservice,
  toAPI_EserviceVersion,
  toAPI_EserviceVersionInterfaceDocument,
} from "../models/apiConverters.ts";
import { apiTags } from "../models/apiTags.ts";
import { getKnodiaServiceHeaders } from "../utils/headers.ts";

interface EserviceRouterOptions {
  eserviceProcessClient: EserviceProcessClient;
  tokenProvider: RefreshableInternalTokenGenerator;
}

export const eserviceRouter: FastifyPluginAsyncZod<
  EserviceRouterOptions
  // eslint-disable-next-line max-lines-per-function
> = async (fastify, { eserviceProcessClient, tokenProvider }) => {
  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info(
        { query: req.query, requestBody: req.body },
        "Getting catalog E-services with query parameters and body data",
      );

      const token = await tokenProvider.get();
      const headers = getKnodiaServiceHeaders(correlationId, token);

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
        `Getting E-service with ID ${req.params.eserviceId}`,
      );

      const token = await tokenProvider.get();
      const headers = getKnodiaServiceHeaders(correlationId, token);

      const { data } = await eserviceProcessApi.getEservice({
        client: eserviceProcessClient,
        headers,
        path: { eserviceId: req.params.eserviceId },
      });

      res.send(toAPI_Eservice(data));
    },
    method: "GET",
    schema: {
      description: "Retrieve an E-service",
      operationId: "getEservice",
      params: API_EserviceIdPathParam,
      response: {
        200: API_Eservice.meta({
          description: "E-service retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        404: API_Problem.meta({ description: "E-service not found" }),
      },
      summary: "Get E-service",
      tags: [apiTags.resource],
    },
    url: "/eservices/:eserviceId",
  });

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info(
        { requestParams: req.params },
        `Getting latest version of E-service with ID ${req.params.eserviceId}`,
      );

      const token = await tokenProvider.get();
      const headers = getKnodiaServiceHeaders(correlationId, token);

      const { data } = await eserviceProcessApi.getEserviceLatestVersion({
        client: eserviceProcessClient,
        headers,
        path: { eserviceId: req.params.eserviceId },
      });

      res.send(toAPI_EserviceVersion(data));
    },
    method: "GET",
    schema: {
      description: "Retrieve the latest version of an E-service",
      operationId: "getEserviceLatestVersion",
      params: API_EserviceIdPathParam,
      response: {
        200: API_EserviceVersion.meta({
          description: "E-service latest version retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        404: API_Problem.meta({ description: "E-service not found" }),
      },
      summary: "Get E-service latest version",
      tags: [apiTags.resource],
    },
    url: "/eservices/:eserviceId/versions/latest",
  });

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info(
        { requestParams: req.params },
        `Getting interface of latest version of E-service with ID ${req.params.eserviceId}`,
      );

      const token = await tokenProvider.get();
      const headers = getKnodiaServiceHeaders(correlationId, token);

      const { data } =
        await eserviceProcessApi.getEserviceLatestVersionInterface({
          client: eserviceProcessClient,
          headers,
          path: { eserviceId: req.params.eserviceId },
        });

      res.send(toAPI_EserviceVersionInterfaceDocument(data));
    },
    method: "GET",
    schema: {
      description:
        "Retrieve the interface document of the latest version of an E-service",
      operationId: "getEserviceLatestVersionInterface",
      params: API_EserviceIdPathParam,
      response: {
        200: API_EserviceVersionInterfaceDocument.meta({
          description:
            "E-service latest version interface document retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        404: API_Problem.meta({ description: "E-service not found" }),
      },
      summary: "Get E-service latest version interface",
      tags: [apiTags.resource],
    },
    url: "/eservices/:eserviceId/versions/latest/interface",
  });

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info(
        { requestParams: req.params },
        `Downloading interface of E-service with ID ${req.params.eserviceId}`,
      );

      const token = await tokenProvider.get();
      const headers = getKnodiaServiceHeaders(correlationId, token);

      const [{ data: metadata }, { data: blob }] = await Promise.all([
        eserviceProcessApi.getEserviceLatestVersionInterface({
          client: eserviceProcessClient,
          headers,
          path: { eserviceId: req.params.eserviceId },
        }),
        eserviceProcessApi.downloadEserviceLatestVersionInterface({
          client: eserviceProcessClient,
          headers,
          path: { eserviceId: req.params.eserviceId },
        }),
      ]);

      const buffer = Buffer.from(await blob.arrayBuffer());

      res.raw.writeHead(200, {
        "Content-Disposition": `attachment; filename="${metadata.name}"`,
        "Content-Type": metadata.contentType,
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
      response: {
        200: API_FileDownload.meta({
          description: "E-service interface document downloaded successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        404: API_Problem.meta({ description: "Not Found" }),
      },
      summary: "Download E-service latest version interface",
      tags: [apiTags.resource],
    },
    url: "/eservices/:eserviceId/versions/latest/interface/download",
  });
};
