import type { KnodeId } from "@knodia/common-models/ids";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { API_CreatedResource } from "@knodia/common-models/api";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import {
  API_Problem,
  getKnodiaServiceHeaders,
} from "@knodia/fastify-zod-api-commons/models";
import { assertEntityExists } from "@knodia/fastify-zod-api-commons/utils";
import {
  organizationProcessApi,
  type OrganizationProcessClient,
} from "@knodia/organization-process-client";
import {
  API_ExternalPurposeFormSchemasResponse,
  API_PurposeIdPathParam,
} from "@knodia/purpose-models/api";
import {
  remoteResourcesManagerApi,
  type RemoteResourcesManagerClient,
} from "@knodia/remote-resources-manager-client";

import { apiTags } from "../../models/apiTags.ts";
import {
  API_ConsumerPurposes,
  API_GetConsumerPurposeDetailQueryParams,
  API_GetConsumerPurposeFormSchemaQueryParams,
  API_GetConsumerPurposesQueryParams,
  API_PurposeDetails,
  API_PurposeSeed,
} from "../../models/purpose/api.ts";
import {
  toAPI_ConsumerPurpose,
  toAPI_ConsumerPurposeDetails,
} from "../../models/purpose/apiConverter.ts";
import { getUISessionAuthData } from "../../utils/authData.ts";

interface PurposeConsumerRouterOptions {
  knodeId: KnodeId;
  organizationProcessClient: OrganizationProcessClient;
  remoteResourcesManagerClient: RemoteResourcesManagerClient;
}

export const purposeConsumerRouter: FastifyPluginAsyncZod<
  PurposeConsumerRouterOptions
  // eslint-disable-next-line max-lines-per-function
> = async (
  fastify,
  { knodeId, organizationProcessClient, remoteResourcesManagerClient },
) => {
  fastify.route({
    handler: async (req, res) => {
      const { authData, correlationId, logger } =
        getContextValues(requestContext);

      const { organizationId: consumerId } = getUISessionAuthData(authData);

      logger.info(
        { requestQuery: req.query },
        "Getting Consumer Purposes with query parameters",
      );

      const { limit, offset } = req.query;
      const headers = getKnodiaServiceHeaders(req, correlationId);

      const { data } = await remoteResourcesManagerApi.getPurposes({
        client: remoteResourcesManagerClient,
        headers,
        query: {
          consumerId,
          limit,
          offset,
        },
      });

      if (data.results.length === 0) {
        res.send({ pagination: data.pagination, results: [] });
        return;
      }

      const uniqueEservices = [
        ...new Map(
          data.results.map((p) => [p.eserviceId, p.knodeId]),
        ).entries(),
      ];

      const eserviceDetailsEntries = await Promise.all(
        uniqueEservices.map(async ([eserviceId, knodeId]) => {
          const { data: details } =
            await remoteResourcesManagerApi.getEserviceDetails({
              client: remoteResourcesManagerClient,
              headers,
              path: { eserviceId },
              query: { knodeId },
            });
          return [eserviceId, details] as const;
        }),
      );

      const eserviceDetailsMap = new Map(eserviceDetailsEntries);

      const results = data.results.map((purpose) =>
        toAPI_ConsumerPurpose({
          eserviceDetails: assertEntityExists(
            eserviceDetailsMap.get(purpose.eserviceId),
            `E-service ${purpose.eserviceId} not found for Purpose ${purpose.id}`,
          ),
          purpose,
        }),
      );

      res.send({
        pagination: data.pagination,
        results,
      });
    },
    method: "GET",
    schema: {
      description:
        "Retrieve a paginated list of Purposes created by the logged-in consumer",
      operationId: "getConsumerPurposes",
      querystring: API_GetConsumerPurposesQueryParams,
      response: {
        200: API_ConsumerPurposes.meta({
          description: "Consumer Purposes retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
      },
      summary: "List consumer Purposes",
      tags: [apiTags.purpose],
    },
    url: "/consumer/purposes",
  });

  fastify.route({
    handler: async (req, res) => {
      const { authData, correlationId, logger } =
        getContextValues(requestContext);

      const { organizationId: consumerId } = getUISessionAuthData(authData);

      logger.info(
        { consumerId, requestBody: req.body },
        `Creating Purpose for consumer ${consumerId} on knode ${req.body.knodeId}`,
      );

      const { data } = await remoteResourcesManagerApi.createPurpose({
        body: req.body,
        client: remoteResourcesManagerClient,
        headers: getKnodiaServiceHeaders(req, correlationId),
      });

      res.status(201).send({ id: data.id });
    },
    method: "POST",
    schema: {
      body: API_PurposeSeed,
      description: "Create a new Purpose for an E-service",
      operationId: "createConsumerPurpose",
      response: {
        201: API_CreatedResource.meta({
          description: "Purpose created successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Not Found" }),
        409: API_Problem.meta({ description: "Conflict" }),
      },
      summary: "Create a consumer Purpose",
      tags: [apiTags.purpose],
    },
    url: "/consumer/purposes",
  });

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info(
        `Getting current Purpose form schemas from Knode ${req.query.knodeId}`,
      );

      const { data } =
        await remoteResourcesManagerApi.getCurrentPurposeFormSchemas({
          client: remoteResourcesManagerClient,
          headers: getKnodiaServiceHeaders(req, correlationId),
          query: { knodeId: req.query.knodeId },
        });

      res.send(data);
    },
    method: "GET",
    schema: {
      description:
        "Retrieve the current Purpose form schemas (JSON Schema + UI Schema) with their version",
      operationId: "getConsumerCurrentPurposeFormSchemas",
      querystring: API_GetConsumerPurposeFormSchemaQueryParams,
      response: {
        200: API_ExternalPurposeFormSchemasResponse.meta({
          description: "Current Purpose form schemas retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
      },
      summary: "Get current Purpose form schemas",
      tags: [apiTags.purpose],
    },
    url: "/consumer/purposes/formSchemas/current",
  });

  fastify.route({
    handler: async (req, res) => {
      const { authData, correlationId, logger } =
        getContextValues(requestContext);

      const { organizationId: consumerId } = getUISessionAuthData(authData);

      logger.info(
        { requestParams: req.params, requestQuery: req.query },
        `Getting Consumer Purpose with ID ${req.params.purposeId} from Knode ${req.query.knodeId}`,
      );

      const headers = getKnodiaServiceHeaders(req, correlationId);

      const { data: purpose } = await remoteResourcesManagerApi.getPurpose({
        client: remoteResourcesManagerClient,
        headers,
        path: { purposeId: req.params.purposeId },
        query: { knodeId: req.query.knodeId },
      });

      const [{ data: eserviceDetails }, { data: consumer }] = await Promise.all(
        [
          remoteResourcesManagerApi.getEserviceDetails({
            client: remoteResourcesManagerClient,
            headers,
            path: { eserviceId: purpose.eserviceId },
            query: { knodeId: req.query.knodeId },
          }),
          organizationProcessApi.getOrganization({
            client: organizationProcessClient,
            headers,
            path: { organizationId: consumerId },
          }),
        ],
      );

      const agreement = assertEntityExists(
        eserviceDetails.agreement,
        `Agreement not found for Purpose ${purpose.id} (eserviceId: ${purpose.eserviceId})`,
      );

      res.status(200).send(
        toAPI_ConsumerPurposeDetails({
          agreement,
          consumer: { ...consumer, knodeId },
          eserviceDetails,
          purpose,
        }),
      );
    },
    method: "GET",
    schema: {
      description: "Retrieve a Consumer Purpose with details",
      operationId: "getConsumerPurposeDetails",
      params: API_PurposeIdPathParam,
      querystring: API_GetConsumerPurposeDetailQueryParams,
      response: {
        200: API_PurposeDetails.meta({
          description: "Consumer Purpose details retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Not Found" }),
      },
      summary: "Get consumer Purpose details",
      tags: [apiTags.purpose],
    },
    url: "/consumer/purposes/:purposeId",
  });
};
