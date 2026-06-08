/* eslint-disable max-lines-per-function */
import type { CorrelationId, KnodeId } from "@knodia/common-models/ids";
import type { RefreshableInternalTokenGenerator } from "@knodia/token-generator/refreshable";
import type { AxiosResponse } from "axios";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
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
  API_PurposeFormSchemasResponse,
  API_PurposeIdPathParam,
  API_Purposes,
  API_PurposeSeed,
} from "../models/purpose/api.ts";
import {
  toAPI_Purpose,
  toProcessAPI_PurposeSeed,
  toProcessAPI_PurposeState,
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
  response: AxiosResponse<purposeProcessApi.Purpose>,
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
  const getHeaders = async (correlationId: CorrelationId) =>
    getKnodiaServiceHeaders(correlationId, await tokenProvider.get());

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info({ requestBody: req.body }, "Creating purpose with body data");

      const headers = await getHeaders(correlationId);

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
        "Create a new Purpose for an E-service on behalf of a Consumer. The request body can be either PurposeSeedForProvideData or PurposeSeedForReceiveData based on the Eservice mode. The first one carries inline form answers compiled by the Consumer, while the second one references a pre-filled PurposeFormOption compiled by the Producer.",
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
    handler: async (_req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info("Getting current Purpose form schemas");

      const { data } = await purposeProcessApi.getCurrentPurposeFormSchemas({
        client: purposeProcessClient,
        headers: await getHeaders(correlationId),
      });

      res.send(data);
    },
    method: "GET",
    schema: {
      description:
        "Retrieve the current Purpose form schemas (JSON Schema, UI Schema, legal texts, UI texts) with their version",
      operationId: "getCurrentPurposeFormSchemas",
      response: {
        200: API_PurposeFormSchemasResponse.meta({
          description: "Current Purpose form schemas retrieved successfully",
        }),
      },
      summary: "Get current Purpose form schemas",
      tags: [apiTags.resource, apiTags.purpose],
    },
    url: "/purposes/formSchemas/current",
  });

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info(`Getting Purpose with ID ${req.params.purposeId}`);

      const headers = await getHeaders(correlationId);

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

      logger.info(`Reactivating Purpose ${req.params.purposeId}`);

      const headers = await getHeaders(correlationId);

      const response = await purposeProcessApi.reactivatePurposeByConsumer({
        client: purposeProcessClient,
        headers,
        path: { purposeId: req.params.purposeId },
      });

      await pollPurpose(
        pollingService,
        purposeProcessClient,
        response,
        headers,
      );

      res.send(toAPI_Purpose(response.data));
    },
    method: "POST",
    schema: {
      description:
        "Reactivate a Purpose on behalf of its Consumer; the Consumer must belong to the caller Knode",
      operationId: "reactivatePurpose",
      params: API_PurposeIdPathParam,
      response: {
        200: API_Purpose.meta({
          description: "Purpose reactivated successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        404: API_Problem.meta({ description: "Not Found" }),
        409: API_Problem.meta({ description: "Conflict" }),
      },
      summary: "Reactivate a Purpose",
      tags: [apiTags.resource, apiTags.purpose],
    },
    url: "/purposes/:purposeId/reactivate",
  });

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info(`Suspending Purpose ${req.params.purposeId}`);

      const headers = await getHeaders(correlationId);

      const response = await purposeProcessApi.suspendPurposeByConsumer({
        client: purposeProcessClient,
        headers,
        path: { purposeId: req.params.purposeId },
      });

      await pollPurpose(
        pollingService,
        purposeProcessClient,
        response,
        headers,
      );

      res.send(toAPI_Purpose(response.data));
    },
    method: "POST",
    schema: {
      description:
        "Suspend a Purpose on behalf of its Consumer; the Consumer must belong to the caller Knode",
      operationId: "suspendPurpose",
      params: API_PurposeIdPathParam,
      response: {
        200: API_Purpose.meta({
          description: "Purpose suspended successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        404: API_Problem.meta({ description: "Not Found" }),
        409: API_Problem.meta({ description: "Conflict" }),
      },
      summary: "Suspend a Purpose",
      tags: [apiTags.resource, apiTags.purpose],
    },
    url: "/purposes/:purposeId/suspend",
  });

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info(`Archiving Purpose ${req.params.purposeId}`);

      const headers = await getHeaders(correlationId);

      const response = await purposeProcessApi.archivePurpose({
        client: purposeProcessClient,
        headers,
        path: { purposeId: req.params.purposeId },
      });

      await pollPurpose(
        pollingService,
        purposeProcessClient,
        response,
        headers,
      );

      res.send(toAPI_Purpose(response.data));
    },
    method: "POST",
    schema: {
      description:
        "Archive a Purpose on behalf of its Consumer; the Consumer must belong to the caller Knode",
      operationId: "archivePurpose",
      params: API_PurposeIdPathParam,
      response: {
        200: API_Purpose.meta({
          description: "Purpose archived successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        404: API_Problem.meta({ description: "Not Found" }),
        409: API_Problem.meta({ description: "Conflict" }),
      },
      summary: "Archive a Purpose",
      tags: [apiTags.resource, apiTags.purpose],
    },
    url: "/purposes/:purposeId/archive",
  });

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info(
        { requestQuery: req.query },
        "Getting Purposes with query params",
      );

      const headers = await getHeaders(correlationId);

      const { consumerId, eserviceId, limit, offset, state } = req.query;

      const { data } = await purposeProcessApi.getPurposes({
        client: purposeProcessClient,
        headers,
        query: {
          consumerId,
          consumerKnodeId: callerKnodeId,
          eserviceId,
          limit,
          offset,
          state: state?.map(toProcessAPI_PurposeState),
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
