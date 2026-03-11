import type { EserviceProcessClient } from "@knodia/eservice-process-client";
import type { RefreshableInternalTokenGenerator } from "@knodia/token-generator/refreshable";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { API_FileDownload } from "@knodia/common-models/api";
import { eserviceProcessApi } from "@knodia/eservice-process-client";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import { API_Problem } from "@knodia/fastify-zod-api-commons/models";

import { apiTags } from "../models/apiTags.ts";
import {
  API_CatalogEserviceSearchResults,
  API_Eservice,
  API_EserviceIdPathParam,
  API_EserviceVersion,
  API_EserviceVersionInterfaceDocument,
  API_GetCatalogEserviceSearchParams,
  API_GetCatalogEservicesQueryParams,
} from "../models/eservice/api.ts";
import {
  toAPI_CatalogEserviceSearchResult,
  toAPI_Eservice,
  toAPI_EserviceVersion,
  toAPI_EserviceVersionInterfaceDocument,
} from "../models/eservice/apiConverters.ts";
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
        { requestBody: req.body, requestQuery: req.query },
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
      // No auth required currently. Mutual TLS will be added in the future;
      // OpenAPI 3.1 supports `type: mutualTLS` security schemes natively,
      // and we are evaluating upgrading to 3.1 to enable this
      // (see https://pagopa.atlassian.net/browse/KN-96).
      security: [],
      summary: "Search for E-services",
      tags: [apiTags.operation, apiTags.eservice],
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
      tags: [apiTags.resource, apiTags.eservice],
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
      const path = { eserviceId: req.params.eserviceId };

      const [{ data: version }, { data: interfaceDoc }] = await Promise.all([
        eserviceProcessApi.getEserviceLatestVersion({
          client: eserviceProcessClient,
          headers,
          path,
        }),
        eserviceProcessApi.getEserviceLatestVersionInterface({
          client: eserviceProcessClient,
          headers,
          path,
        }),
      ]);

      res.send(toAPI_EserviceVersion(version, interfaceDoc));
    },
    method: "GET",
    schema: {
      description: "Retrieve the latest Version of an E-service",
      operationId: "getEserviceLatestVersion",
      params: API_EserviceIdPathParam,
      response: {
        200: API_EserviceVersion.meta({
          description: "E-service latest Version retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        404: API_Problem.meta({ description: "E-service not found" }),
      },
      summary: "Get E-service latest version",
      tags: [apiTags.resource, apiTags.eservice],
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
        "Retrieve the Interface Document of the latest Version of an E-service",
      operationId: "getEserviceLatestVersionInterface",
      params: API_EserviceIdPathParam,
      response: {
        200: API_EserviceVersionInterfaceDocument.meta({
          description:
            "E-service latest Version Interface Document retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        404: API_Problem.meta({ description: "E-service not found" }),
      },
      summary: "Get E-service latest Version Interface Document",
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

      const buffer =
        typeof blob === "string"
          ? Buffer.from(blob)
          : Buffer.from(await blob.arrayBuffer());

      res.raw.writeHead(200, {
        "Content-Disposition": `attachment; filename="${metadata.name}"`,
        "Content-Type": metadata.contentType,
      });
      res.raw.end(buffer);
    },
    method: "GET",
    schema: {
      description:
        "Download the Interface Document for the latest Version of an E-service",
      operationId: "downloadEserviceLatestVersionInterface",
      params: API_EserviceIdPathParam,
      produces: ["application/octet-stream"],
      response: {
        200: API_FileDownload.meta({
          description: "E-service Interface Document downloaded successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        404: API_Problem.meta({ description: "Not Found" }),
      },
      summary: "Download E-service latest Version Interface Document",
      tags: [apiTags.resource],
    },
    url: "/eservices/:eserviceId/versions/latest/interface/download",
  });
};
