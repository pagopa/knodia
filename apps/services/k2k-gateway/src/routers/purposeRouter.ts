import type { KnodeId } from "@knodia/common-models/ids";
import type { RefreshableInternalTokenGenerator } from "@knodia/token-generator/refreshable";
import type { AxiosResponse } from "axios";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { type API_CreatedResource } from "@knodia/common-models/api";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import {
  API_Problem,
  type KnodiaServiceHeaders,
} from "@knodia/fastify-zod-api-commons/models";
import {
  isPolledVersionAtLeastResponseVersion,
  type PollingService,
} from "@knodia/polling";
import {
  purposeProcessApi,
  type PurposeProcessClient,
} from "@knodia/purpose-process-client";

import { apiTags } from "../models/apiTags.ts";
import {
  API_CreatedPurposeResource,
  API_GetPurposesQueryParams,
  API_Purpose,
  API_PurposeFormSchema,
  API_PurposeFormSchemaVersionPathParam,
  API_PurposeFormUiSchema,
  API_PurposeIdPathParam,
  API_Purposes,
  API_PurposeSeed,
} from "../models/purpose/api.ts";
import {
  toAPI_Purpose,
  toProcessAPI_PurposeSeed,
} from "../models/purpose/apiConverter.ts";
import { getKnodiaServiceHeaders } from "../utils/headers.ts";

interface PurposeRouterOptions {
  callerKnodeId: KnodeId;
  pollingService: PollingService;
  purposeProcessClient: PurposeProcessClient;
  tokenProvider: RefreshableInternalTokenGenerator;
}

const retrievePurpose = async (
  purposeProcessClient: PurposeProcessClient,
  purposeId: string,
  headers: KnodiaServiceHeaders,
) =>
  await purposeProcessApi.getPurpose({
    client: purposeProcessClient,
    headers,
    path: { purposeId },
  });

const pollPurpose = (
  pollingService: PollingService,
  purposeProcessClient: PurposeProcessClient,
  response: AxiosResponse<API_CreatedResource>,
  headers: KnodiaServiceHeaders,
) =>
  pollingService.pollResourceWithMetadata(() =>
    retrievePurpose(purposeProcessClient, response.data.id, headers),
  )({
    condition: isPolledVersionAtLeastResponseVersion(response),
  });

export const purposeRouter: FastifyPluginAsyncZod<
  PurposeRouterOptions
> = async (
  fastify,
  { callerKnodeId, pollingService, purposeProcessClient, tokenProvider },
) => {
  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info({ requestBody: req.body }, "Creating purpose with body data");

      const token = await tokenProvider.get();
      const headers = getKnodiaServiceHeaders(correlationId, token);

      const response = await purposeProcessApi.createPurpose({
        body: toProcessAPI_PurposeSeed(req.body, callerKnodeId),
        client: purposeProcessClient,
        headers,
      });

      await pollPurpose(
        pollingService,
        purposeProcessClient,
        response,
        headers,
      );

      res.status(201).send({
        id: response.data.id,
      });
    },
    method: "POST",
    schema: {
      body: API_PurposeSeed,
      description:
        "Create a new Purpose for a Consumer to declare the intended use of a Producer's E-service",
      operationId: "createPurpose",
      response: {
        201: API_CreatedPurposeResource.meta({
          description: "Purpose created successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        404: API_Problem.meta({ description: "Not Found" }),
        409: API_Problem.meta({ description: "Conflict" }),
      },
      summary: "Create a new Purpose",
      tags: [apiTags.resource, apiTags.purpose],
    },
    url: "/purposes",
  });

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info(`Getting Purpose form schema version ${req.params.version}`);

      const token = await tokenProvider.get();
      const { data } = await purposeProcessApi.getPurposeFormSchema({
        client: purposeProcessClient,
        headers: getKnodiaServiceHeaders(correlationId, token),
        path: { version: req.params.version },
      });

      res.send(data);
    },
    method: "GET",
    schema: {
      description:
        "Retrieve the JSON Schema for validating Purpose form answers",
      operationId: "getPurposeFormSchema",
      params: API_PurposeFormSchemaVersionPathParam,
      response: {
        200: API_PurposeFormSchema.meta({
          description: "Purpose form schema retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
      },
      summary: "Get Purpose form schema by version",
      tags: [apiTags.resource, apiTags.purpose],
    },
    url: "/purposes/formSchemas/:version",
  });

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info(
        `Getting Purpose form UI schema version ${req.params.version}`,
      );

      const token = await tokenProvider.get();
      const { data } = await purposeProcessApi.getPurposeFormUiSchema({
        client: purposeProcessClient,
        headers: getKnodiaServiceHeaders(correlationId, token),
        path: { version: req.params.version },
      });

      res.send(data);
    },
    method: "GET",
    schema: {
      description:
        "Retrieve the UI Schema for rendering the Purpose form (JSON Forms format)",
      operationId: "getPurposeFormUiSchema",
      params: API_PurposeFormSchemaVersionPathParam,
      response: {
        200: API_PurposeFormUiSchema.meta({
          description: "Purpose form UI schema retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
      },
      summary: "Get Purpose form UI schema by version",
      tags: [apiTags.resource, apiTags.purpose],
    },
    url: "/purposes/formSchemas/:version/ui",
  });

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info(`Getting Purpose with ID ${req.params.purposeId}`);

      const token = await tokenProvider.get();
      const headers = getKnodiaServiceHeaders(correlationId, token);

      const { data } = await retrievePurpose(
        purposeProcessClient,
        req.params.purposeId,
        headers,
      );

      res.send(toAPI_Purpose(data));
    },
    method: "GET",
    schema: {
      description: "Retrieve a Purpose",
      operationId: "getPurpose",
      params: API_PurposeIdPathParam,
      response: {
        200: API_Purpose.meta({
          description: "Purpose retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        404: API_Problem.meta({ description: "Purpose not found" }),
      },
      summary: "Get Purpose",
      tags: [apiTags.purpose, apiTags.resource],
    },
    url: "/purposes/:purposeId",
  });

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info(
        { requestQuery: req.query },
        "Getting Purposes with query params",
      );

      const token = await tokenProvider.get();
      const headers = getKnodiaServiceHeaders(correlationId, token);

      const { consumerId, eserviceId, limit, offset } = req.query;

      const { data } = await purposeProcessApi.getPurposes({
        client: purposeProcessClient,
        headers,
        query: {
          consumerId,
          consumerKnodeId: callerKnodeId,
          eserviceId,
          limit,
          offset,
        },
      });

      res.status(200).send({
        pagination: data.pagination,
        results: data.results.map(toAPI_Purpose),
      });
    },
    method: "GET",
    schema: {
      description: "Retrieve a list of Purposes",
      operationId: "getPurposes",
      querystring: API_GetPurposesQueryParams,
      summary: "Get Purposes",
      response: {
        200: API_Purposes.meta({
          description: "Purposes retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
      },
      tags: [apiTags.resource, apiTags.purpose],
    },
    url: "/purposes",
  });
};
