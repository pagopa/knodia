import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { API_FileDownload } from "@knodia/common-models/api";
import { API_EserviceIdPathParam } from "@knodia/eservice-models/api";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import { API_Problem } from "@knodia/fastify-zod-api-commons/models";
import {
  remoteResourcesManagerApi,
  type RemoteResourcesManagerClient,
} from "@knodia/remote-resources-manager-client";

import {
  API_ConsumerCatalogEserviceSearchResults,
  API_ConsumerEserviceDetails,
  API_GetConsumerCatalogEserviceSearchParams,
  API_GetConsumerCatalogEservicesQueryParams,
  API_GetConsumerEserviceDetailsQueryParams,
} from "../../models/api.ts";
import {
  toAPI_ConsumerCatalogEserviceSearchResult,
  toAPI_ConsumerEserviceDetails,
} from "../../models/apiConverter.ts";
import { apiTags } from "../../models/apiTags.ts";
import { getKnodiaServiceHeaders } from "../../utils/headers.ts";

interface RemoteResourcesManagerRouterOptions {
  remoteResourcesManagerClient: RemoteResourcesManagerClient;
}

export const eserviceConsumerRouter: FastifyPluginAsyncZod<
  RemoteResourcesManagerRouterOptions
> = async (fastify, { remoteResourcesManagerClient }) => {
  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info(
        { query: req.query, requestBody: req.body },
        `Getting E-services owned by Knode ${req.body.knodeId} with query parameters and body data`,
      );

      const { data } = await remoteResourcesManagerApi.getCatalogEservices({
        body: req.body,
        client: remoteResourcesManagerClient,
        headers: getKnodiaServiceHeaders(req, correlationId),
        query: req.query,
      });

      res.send({
        pagination: data.pagination,
        results: data.results.map((r) =>
          toAPI_ConsumerCatalogEserviceSearchResult(
            r,
            Math.random() >= 0.5, // TODO: hasRequiredAttributes - implement actual check
            { en: "Producer name" }, // TODO: retrieve producer name
          ),
        ),
      });
    },
    method: "POST",
    schema: {
      body: API_GetConsumerCatalogEserviceSearchParams,
      description:
        "Search for E-services according to search criteria and considering only E-services with an active or suspended Version",
      operationId: "getConsumerCatalogEservices",
      querystring: API_GetConsumerCatalogEservicesQueryParams,
      response: {
        200: API_ConsumerCatalogEserviceSearchResults.meta({
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
    url: "/consumer/catalog",
  });

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info(
        { params: req.params, query: req.query },
        `Getting consumer E-service details with ID ${req.params.eserviceId}`,
      );

      const { data } = await remoteResourcesManagerApi.getEserviceDetails({
        client: remoteResourcesManagerClient,
        headers: getKnodiaServiceHeaders(req, correlationId),
        path: { eserviceId: req.params.eserviceId },
        query: { knodeId: req.query.knodeId },
      });

      res.send(toAPI_ConsumerEserviceDetails(data));
    },
    method: "GET",
    schema: {
      description: "Retrieve an E-service with all its details for consumers",
      operationId: "getConsumerEserviceDetails",
      params: API_EserviceIdPathParam,
      querystring: API_GetConsumerEserviceDetailsQueryParams,
      response: {
        200: API_ConsumerEserviceDetails.meta({
          description: "E-service detail retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "E-service not found" }),
      },
      summary: "Get consumer E-service details",
      tags: [apiTags.eservice],
    },
    url: "/consumer/eservices/:eserviceId",
  });

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info(
        { params: req.params, query: req.query },
        `Downloading interface of consumer E-service with ID ${req.params.eserviceId}`,
      );

      const headers = getKnodiaServiceHeaders(req, correlationId);
      const path = { eserviceId: req.params.eserviceId };
      const query = { knodeId: req.query.knodeId };

      const [{ data: detail }, { data: blob, headers: downloadHeaders }] =
        await Promise.all([
          remoteResourcesManagerApi.getCatalogEserviceDetail({
            client: remoteResourcesManagerClient,
            headers,
            path,
            query,
          }),
          remoteResourcesManagerApi.downloadEserviceLatestVersionInterface({
            client: remoteResourcesManagerClient,
            headers,
            path,
            query,
          }),
        ]);

      const buffer =
        typeof blob === "string"
          ? Buffer.from(blob)
          : Buffer.from(await blob.arrayBuffer());

      res.raw.writeHead(200, {
        "Content-Disposition": `attachment; filename="${detail.interfaceDocument.name}"`,
        "Content-Type":
          downloadHeaders["content-type"] ?? "application/octet-stream",
      });
      res.raw.end(buffer);
    },
    method: "GET",
    schema: {
      description:
        "Download the interface document for the latest version of an E-service",
      operationId: "getConsumerEserviceLatestVersionInterface",
      params: API_EserviceIdPathParam,
      produces: ["application/octet-stream"],
      querystring: API_GetConsumerCatalogEserviceDetailQueryParams,
      response: {
        200: API_FileDownload.meta({
          description: "E-service interface document downloaded successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        404: API_Problem.meta({ description: "Not Found" }),
      },
      summary: "Download consumer E-service latest version interface",
      tags: [apiTags.eservice],
    },
    url: "/consumer/eservices/:eserviceId/interface",
  });
};
