import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { API_CreatedResource } from "@knodia/common-models/api";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import {
  API_Problem,
  getKnodiaServiceHeaders,
} from "@knodia/fastify-zod-api-commons/models";
import {
  API_PurposeFormSchema,
  API_PurposeFormSchemaVersionPathParam,
  API_PurposeFormUiSchema,
} from "@knodia/purpose-models/api";
import {
  remoteResourcesManagerApi,
  type RemoteResourcesManagerClient,
} from "@knodia/remote-resources-manager-client";

import { apiTags } from "../../models/apiTags.ts";
import {
  API_GetConsumerPurposeFormSchemaQueryParams,
  API_PurposeSeed,
} from "../../models/purpose/api.ts";
import { getUISessionAuthData } from "../../utils/authData.ts";

interface PurposeConsumerRouterOptions {
  remoteResourcesManagerClient: RemoteResourcesManagerClient;
}

export const purposeConsumerRouter: FastifyPluginAsyncZod<
  PurposeConsumerRouterOptions
> = async (fastify, { remoteResourcesManagerClient }) => {
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
