import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { API_AgreementState } from "@knodia/agreement-models/api";
import { hasAllRequiredAttributes } from "@knodia/attribute-models";
import { API_FileDownload } from "@knodia/common-models/api";
import { API_EserviceIdPathParam } from "@knodia/eservice-models/api";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import {
  parseContentDispositionFileName,
  sendFileDownload,
} from "@knodia/fastify-zod-api-commons/http";
import {
  API_Problem,
  getKnodiaServiceHeaders,
} from "@knodia/fastify-zod-api-commons/models";
import {
  keychainProcessApi,
  type KeychainProcessClient,
} from "@knodia/keychain-process-client";
import {
  organizationProcessApi,
  type OrganizationProcessClient,
} from "@knodia/organization-process-client";
import { API_PurposeState } from "@knodia/purpose-models/api";
import {
  remoteResourcesManagerApi,
  type RemoteResourcesManagerClient,
} from "@knodia/remote-resources-manager-client";

import type { BffProcessConfig } from "../../config/config.ts";

import { apiTags } from "../../models/apiTags.ts";
import {
  API_ConsumerCatalogEserviceSearchResults,
  API_ConsumerEserviceDetails,
  API_ConsumerEservices,
  API_GetConsumerCatalogEserviceSearchParams,
  API_GetConsumerCatalogEservicesQueryParams,
  API_GetConsumerEserviceDetailsQueryParams,
  API_GetConsumerEservicesQueryParams,
} from "../../models/eservice/api.ts";
import {
  toAPI_ConsumerCatalogEserviceSearchResult,
  toAPI_ConsumerEservice,
  toAPI_ConsumerEserviceDetails,
} from "../../models/eservice/apiConverter.ts";
import { getUISessionAuthData } from "../../utils/authData.ts";

interface EserviceConsumerRouterOptions {
  config: BffProcessConfig;
  keychainProcessClient: KeychainProcessClient;
  organizationProcessClient: OrganizationProcessClient;
  remoteResourcesManagerClient: RemoteResourcesManagerClient;
}

const nonArchivedAgreementStates = [
  API_AgreementState.enum.Active,
  API_AgreementState.enum.Suspended,
  API_AgreementState.enum.PendingConsumerOperatorIdentification,
];

export const eserviceConsumerRouter: FastifyPluginAsyncZod<
  EserviceConsumerRouterOptions
  // eslint-disable-next-line max-lines-per-function
> = async (
  fastify,
  {
    config,
    keychainProcessClient,
    organizationProcessClient,
    remoteResourcesManagerClient,
  },
) => {
  fastify.route({
    handler: async (req, res) => {
      const { authData, correlationId, logger } =
        getContextValues(requestContext);
      const { organizationId: consumerId } = getUISessionAuthData(authData);

      logger.info(
        { requestBody: req.body, requestQuery: req.query },
        `Getting E-services owned by Knode ${req.body.knodeId} with query parameters and body data`,
      );

      const [{ data }, { data: consumerOrg }] = await Promise.all([
        remoteResourcesManagerApi.getCatalogEservices({
          body: req.body,
          client: remoteResourcesManagerClient,
          headers: getKnodiaServiceHeaders(req, correlationId),
          query: req.query,
        }),
        organizationProcessApi.getOrganization({
          client: organizationProcessClient,
          headers: getKnodiaServiceHeaders(req, correlationId),
          path: { organizationId: consumerId },
        }),
      ]);

      res.send({
        pagination: data.pagination,
        results: data.results.map((r) =>
          toAPI_ConsumerCatalogEserviceSearchResult(
            r,
            hasAllRequiredAttributes(
              consumerOrg.attributes,
              r.latestVersionRequiredAttributes,
            ),
            req.body.knodeId,
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
      const { authData, correlationId, logger } =
        getContextValues(requestContext);
      const { organizationId: consumerId } = getUISessionAuthData(authData);

      logger.info(
        { params: req.params, query: req.query },
        `Getting E-service details with ID ${req.params.eserviceId}`,
      );

      const headers = getKnodiaServiceHeaders(req, correlationId);

      const [
        { data },
        { data: consumerOrg },
        {
          data: {
            results: [mostRecentPurpose],
          },
        },
      ] = await Promise.all([
        remoteResourcesManagerApi.getEserviceDetails({
          client: remoteResourcesManagerClient,
          headers,
          path: { eserviceId: req.params.eserviceId },
          query: { knodeId: req.query.knodeId },
        }),
        organizationProcessApi.getOrganization({
          client: organizationProcessClient,
          headers,
          path: { organizationId: consumerId },
        }),
        // Fetching only 1 purpose is sufficient for hasRecentlyBeenUpdated:
        // purposes are ordered by updatedAt DESC in the readmodel,
        // so the first result is the most recently updated one.
        remoteResourcesManagerApi.getPurposes({
          client: remoteResourcesManagerClient,
          headers,
          query: {
            eserviceId: req.params.eserviceId,
            limit: 1,
            offset: 0,
          },
        }),
      ]);

      res.send(
        toAPI_ConsumerEserviceDetails(
          data,
          consumerOrg.attributes,
          config.recentUpdateDays,
          mostRecentPurpose,
        ),
      );
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
      summary: "Get E-service details",
      tags: [apiTags.eservice],
    },
    url: "/consumer/eservices/:eserviceId",
  });

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info(
        { params: req.params, query: req.query },
        `Downloading interface of E-service with ID ${req.params.eserviceId}`,
      );

      const { data: blob, headers: downloadHeaders } =
        await remoteResourcesManagerApi.downloadEserviceLatestVersionInterface({
          client: remoteResourcesManagerClient,
          headers: getKnodiaServiceHeaders(req, correlationId),
          path: { eserviceId: req.params.eserviceId },
          query: { knodeId: req.query.knodeId },
          responseType: "arraybuffer",
        });

      const contentType =
        downloadHeaders["content-type"] ?? "application/octet-stream";
      const fileName = parseContentDispositionFileName(
        downloadHeaders["content-disposition"],
      );

      sendFileDownload(
        res,
        Buffer.from(blob as unknown as ArrayBuffer),
        fileName,
        contentType,
      );
    },
    method: "GET",
    schema: {
      description:
        "Download the interface document for the latest version of an E-service",
      operationId: "getConsumerEserviceLatestVersionInterface",
      params: API_EserviceIdPathParam,
      produces: ["application/json", "application/yaml", "application/x-yaml"],
      querystring: API_GetConsumerEserviceDetailsQueryParams,
      response: {
        200: API_FileDownload.meta({
          description: "E-service interface document downloaded successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Not Found" }),
      },
      summary: "Download E-service latest Version Interface",
      tags: [apiTags.eservice],
    },
    url: "/consumer/eservices/:eserviceId/interface",
  });

  fastify.route({
    handler: async (req, res) => {
      const { authData, correlationId, logger } =
        getContextValues(requestContext);

      const { organizationId } = getUISessionAuthData(authData);

      logger.info(
        { requestQuery: req.query },
        `Getting E-services with query parameters`,
      );

      const headers = getKnodiaServiceHeaders(req, correlationId);

      const agreementStates = req.query.agreementState
        ? [req.query.agreementState]
        : nonArchivedAgreementStates;

      const { data } = await remoteResourcesManagerApi.getEservices({
        client: remoteResourcesManagerClient,
        headers,
        query: {
          agreementStates,
          limit: req.query.limit,
          offset: req.query.offset,
        },
      });

      if (data.results.length === 0) {
        res.send({ pagination: data.pagination, results: [] });
        return;
      }

      const results = await Promise.all(
        data.results.map(async (eservice) => {
          // TODO(KN-473): paginate to fetch all active purposes if >50 exist,
          // otherwise consumerKeychains count will be undercounted
          const [
            { data: activePurposes },
            {
              data: {
                results: [mostRecentPurpose],
              },
            },
          ] = await Promise.all([
            remoteResourcesManagerApi.getPurposes({
              client: remoteResourcesManagerClient,
              headers,
              query: {
                eserviceId: eservice.id,
                limit: 50,
                offset: 0,
                state: API_PurposeState.enum.Active,
              },
            }),
            // Fetching only 1 purpose is sufficient for hasRecentlyBeenUpdated:
            // purposes are ordered by updatedAt DESC in the readmodel,
            // so the first result is the most recently updated one.
            remoteResourcesManagerApi.getPurposes({
              client: remoteResourcesManagerClient,
              headers,
              query: {
                eserviceId: eservice.id,
                limit: 1,
                offset: 0,
              },
            }),
          ]);

          // TODO(KN-473): paginate to fetch all keychains if a purpose has >50,
          // otherwise consumerKeychains count will be undercounted
          const keychainResponses = await Promise.all(
            activePurposes.results.map((purpose) =>
              keychainProcessApi.getConsumerKeychains({
                client: keychainProcessClient,
                headers,
                query: {
                  limit: 50,
                  offset: 0,
                  ownerId: organizationId,
                  purpose: `${purpose.knodeId}:${purpose.id}`,
                },
              }),
            ),
          );

          const uniqueKeychainIds = new Set(
            keychainResponses.flatMap((resp) =>
              resp.data.results.map((k) => k.id),
            ),
          );

          const consumerKeychains = uniqueKeychainIds.size;

          return toAPI_ConsumerEservice({
            counters: {
              activePurposes: activePurposes.pagination.total,
              consumerKeychains,
            },
            eservice,
            mostRecentPurpose,
            recentUpdateDays: config.recentUpdateDays,
          });
        }),
      );

      res.send({ pagination: data.pagination, results });
    },
    method: "GET",
    schema: {
      description: "Retrieve E-services",
      operationId: "getConsumerEservices",
      querystring: API_GetConsumerEservicesQueryParams,
      response: {
        200: API_ConsumerEservices.meta({
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
    url: "/consumer/eservices",
  });
};
