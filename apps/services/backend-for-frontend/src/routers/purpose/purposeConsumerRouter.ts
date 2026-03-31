import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { API_CreatedResource } from "@knodia/common-models/api";
import {
  eserviceProcessApi,
  type EserviceProcessClient,
} from "@knodia/eservice-process-client";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import { API_Problem } from "@knodia/fastify-zod-api-commons/models";
import { assertEntityExists } from "@knodia/fastify-zod-api-commons/utils";
import {
  organizationProcessApi,
  type OrganizationProcessClient,
} from "@knodia/organization-process-client";
import {
  API_PurposeFormSchema,
  API_PurposeFormSchemaVersionPathParam,
  API_PurposeFormUiSchema,
} from "@knodia/purpose-models/api";
import {
  purposeProcessApi,
  type PurposeProcessClient,
} from "@knodia/purpose-process-client";
import {
  remoteResourcesManagerApi,
  type RemoteResourcesManagerClient,
} from "@knodia/remote-resources-manager-client";

import { apiTags } from "../../models/apiTags.ts";
import {
  API_ConsumerPurposes,
  API_GetConsumerPurposeFormSchemaQueryParams,
  API_GetConsumerPurposesQueryParams,
  API_PurposeSeed,
} from "../../models/purpose/api.ts";
import { toAPI_ConsumerPurpose } from "../../models/purpose/apiConverter.ts";
import { getUISessionAuthData } from "../../utils/authData.ts";
import { getKnodiaServiceHeaders } from "../../utils/headers.ts";

interface PurposeConsumerRouterOptions {
  eserviceProcessClient: EserviceProcessClient;
  organizationProcessClient: OrganizationProcessClient;
  purposeProcessClient: PurposeProcessClient;
  remoteResourcesManagerClient: RemoteResourcesManagerClient;
}

export const purposeConsumerRouter: FastifyPluginAsyncZod<
  PurposeConsumerRouterOptions
  // eslint-disable-next-line max-lines-per-function
> = async (
  fastify,
  {
    eserviceProcessClient,
    organizationProcessClient,
    purposeProcessClient,
    remoteResourcesManagerClient,
  },
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

      const { data } = await purposeProcessApi.getPurposes({
        client: purposeProcessClient,
        headers: getKnodiaServiceHeaders(req, correlationId),
        query: {
          consumerId,
          limit: req.query.limit,
          offset: req.query.offset,
        },
      });

      if (data.results.length === 0) {
        res.send({ pagination: data.pagination, results: [] });
        return;
      }

      const eserviceIds = new Set(
        data.results.map((purpose) => purpose.eserviceId),
      );
      const [eservicesMap, { data: consumer }] = await Promise.all([
        eserviceProcessApi
          .getEservices({
            client: eserviceProcessClient,
            headers: getKnodiaServiceHeaders(req, correlationId),
            query: {
              eserviceId: Array.from(eserviceIds),
              limit: eserviceIds.size,
              offset: 0,
            },
          })
          .then(
            (res) =>
              new Map(
                res.data.results.map((eservice) => [eservice.id, eservice]),
              ),
          ),
        organizationProcessApi.getOrganization({
          client: organizationProcessClient,
          headers: getKnodiaServiceHeaders(req, correlationId),
          path: { organizationId: consumerId },
        }),
      ]);

      const results = data.results.map((purpose) =>
        toAPI_ConsumerPurpose({
          consumer,
          eservice: assertEntityExists(
            eservicesMap.get(purpose.eserviceId),
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
      description: "Retrieve a paginated list of consumer Purposes",
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
        `Getting Purpose form schema version ${req.params.version} from Knode ${req.query.knodeId}`,
      );

      const { data } = await remoteResourcesManagerApi.getPurposeFormSchema({
        client: remoteResourcesManagerClient,
        headers: getKnodiaServiceHeaders(req, correlationId),
        path: { version: req.params.version },
        query: { knodeId: req.query.knodeId },
      });

      res.send(data);
    },
    method: "GET",
    schema: {
      description:
        "Retrieve the JSON Schema for validating Purpose form answers",
      operationId: "getConsumerPurposeFormSchema",
      params: API_PurposeFormSchemaVersionPathParam,
      querystring: API_GetConsumerPurposeFormSchemaQueryParams,
      response: {
        200: API_PurposeFormSchema.meta({
          description: "Purpose form schema retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
      },
      summary: "Get Purpose form schema by version",
      tags: [apiTags.purpose],
    },
    url: "/consumer/purposes/formSchemas/:version",
  });

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info(
        `Getting Purpose form UI schema version ${req.params.version} from Knode ${req.query.knodeId}`,
      );

      const { data } = await remoteResourcesManagerApi.getPurposeFormUiSchema({
        client: remoteResourcesManagerClient,
        headers: getKnodiaServiceHeaders(req, correlationId),
        path: { version: req.params.version },
        query: { knodeId: req.query.knodeId },
      });

      res.send(data);
    },
    method: "GET",
    schema: {
      description:
        "Retrieve the UI Schema for rendering the Purpose form (JSON Forms format)",
      operationId: "getConsumerPurposeFormUiSchema",
      params: API_PurposeFormSchemaVersionPathParam,
      querystring: API_GetConsumerPurposeFormSchemaQueryParams,
      response: {
        200: API_PurposeFormUiSchema.meta({
          description: "Purpose form UI schema retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
      },
      summary: "Get Purpose form UI schema by version",
      tags: [apiTags.purpose],
    },
    url: "/consumer/purposes/formSchemas/:version/ui",
  });
};
