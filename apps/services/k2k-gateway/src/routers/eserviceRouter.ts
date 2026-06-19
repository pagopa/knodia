import type { FileManager } from "@knodia/file-manager";
import type { RefreshableInternalTokenGenerator } from "@knodia/token-generator/refreshable";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { API_FileDownload } from "@knodia/common-models/api";
import {
  eserviceProcessApi,
  type EserviceProcessClient,
} from "@knodia/eservice-process-client";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import { sendFileDownload } from "@knodia/fastify-zod-api-commons/http";
import { API_Problem } from "@knodia/fastify-zod-api-commons/models";

import { apiTags } from "../models/apiTags.ts";
import {
  API_CatalogEserviceSearchResults,
  API_Eservice,
  API_EserviceIdPathParam,
  API_Eservices,
  API_EserviceVersion,
  API_GetCatalogEserviceSearchParams,
  API_GetCatalogEservicesQueryParams,
  API_GetEservicesQueryParams,
  API_PurposeFormOptions,
} from "../models/eservice/api.ts";
import {
  toAPI_CatalogEserviceSearchResult,
  toAPI_Eservice,
  toAPI_EserviceVersion,
} from "../models/eservice/apiConverters.ts";
import { getKnodiaServiceHeaders } from "../utils/headers.ts";

interface EserviceRouterOptions {
  eserviceInterfacesS3Bucket: string;
  eserviceProcessClient: EserviceProcessClient;
  fileManager: FileManager;
  tokenProvider: RefreshableInternalTokenGenerator;
}

export const eserviceRouter: FastifyPluginAsyncZod<
  EserviceRouterOptions
  // eslint-disable-next-line max-lines-per-function
> = async (
  fastify,
  {
    eserviceInterfacesS3Bucket,
    eserviceProcessClient,
    fileManager,
    tokenProvider,
  },
) => {
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
          data.results.map(enrichWithLatestVersionAndMapToAPIResult),
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
        `Getting purpose form options of E-service with ID ${req.params.eserviceId}`,
      );

      const token = await tokenProvider.get();
      const headers = getKnodiaServiceHeaders(correlationId, token);

      const { data } = await eserviceProcessApi.getEservicePurposeFormOptions({
        client: eserviceProcessClient,
        headers,
        path: { eserviceId: req.params.eserviceId },
      });

      res.send(data);
    },
    method: "GET",
    schema: {
      description:
        "Retrieve the list of PurposeFormOption entries published by the Producer on a ReceiveData E-service. Returns an empty list when the E-service has no receiveDataConfig, and 409 if the E-service is not in ReceiveData mode.",
      operationId: "getEservicePurposeFormOptions",
      params: API_EserviceIdPathParam,
      response: {
        200: API_PurposeFormOptions.meta({
          description: "PurposeFormOption list retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        404: API_Problem.meta({ description: "E-service not found" }),
        409: API_Problem.meta({
          description: "E-service mode is not ReceiveData",
        }),
      },
      summary: "Get PurposeFormOptions for an E-service",
      tags: [apiTags.resource, apiTags.eservice],
    },
    url: "/eservices/:eserviceId/purposeFormOptions",
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
        `Downloading interface of E-service with ID ${req.params.eserviceId}`,
      );

      const token = await tokenProvider.get();
      const headers = getKnodiaServiceHeaders(correlationId, token);

      const { data: metadata } =
        await eserviceProcessApi.getEserviceLatestVersionInterface({
          client: eserviceProcessClient,
          headers,
          path: { eserviceId: req.params.eserviceId },
        });

      const { content } = await fileManager.getBytes({
        bucket: eserviceInterfacesS3Bucket,
        key: metadata.path,
      });

      sendFileDownload(res, content, metadata.name, metadata.contentType);
    },
    method: "GET",
    schema: {
      description:
        "Download the Interface Document for the latest Version of an E-service",
      operationId: "downloadEserviceLatestVersionInterface",
      params: API_EserviceIdPathParam,
      produces: ["application/json", "application/yaml", "application/x-yaml"],
      response: {
        200: API_FileDownload.meta({
          description: "E-service Interface Document downloaded successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        404: API_Problem.meta({ description: "Not Found" }),
      },
      summary: "Download E-service latest version interface",
      tags: [apiTags.resource, apiTags.eservice],
    },
    url: "/eservices/:eserviceId/versions/latest/interface",
  });

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info({ requestQuery: req.query }, "Getting E-services with query");

      const token = await tokenProvider.get();
      const headers = getKnodiaServiceHeaders(correlationId, token);

      const { eserviceId, limit, offset } = req.query;
      const { data } = await eserviceProcessApi.getEservices({
        client: eserviceProcessClient,
        headers,
        query: { eserviceId, limit, offset },
      });

      res.status(200).send({
        pagination: data.pagination,
        results: data.results.map(toAPI_Eservice),
      });
    },
    method: "GET",
    schema: {
      description: "Retrieve a list of E-services",
      operationId: "getEservices",
      querystring: API_GetEservicesQueryParams,
      response: {
        200: API_Eservices.meta({
          description: "E-services retrieved (sorted by name ascending)",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
      },
      summary: "List E-services",
      tags: [apiTags.eservice],
    },
    url: "/eservices",
  });
};
