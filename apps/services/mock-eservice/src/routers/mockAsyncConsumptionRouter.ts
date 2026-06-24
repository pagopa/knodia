import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { type KnodeId } from "@knodia/common-models/ids";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import { API_Problem } from "@knodia/fastify-zod-api-commons/models";
import { randomUUID } from "crypto";
import z from "zod";

import {
  addAsyncCompanyAddressesRequest,
  addAsyncCompanyAddressesResult,
  getAsyncCompanyAddressesRequest,
  getAsyncCompanyAddressesRequestState,
  getAsyncCompanyAddressesResults,
} from "../asyncConsumption/asyncConsumptionRequests.ts";
import {
  ASYNC_CONSUMPTION_MOCK_ESERVICE_ID,
  ASYNC_CONSUMPTION_MOCK_ESERVICE_VERSION_ID,
  ASYNC_CONSUMPTION_MOCK_PRODUCER_ID,
} from "../asyncConsumption/mockup.ts";
import {
  API_AsyncConsumptionRequestId,
  API_AsyncConsumptionResourceId,
  API_CompanyAddressesRequest,
  API_GetCompanyAddressesRequestStateResponse,
  API_GetCompanyAddressesResults,
} from "../models/api.ts";
import { toAPI_GetCompanyAddressesRequestStateResponse } from "../models/apiConverter.ts";
import { apiTags } from "../models/apiTags.ts";
import { assertTokenClaimsAreValidForEservice } from "../utils/validators.ts";

interface MockAsyncConsumptionRouterOptions {
  knodeId: KnodeId;
}

export const mockAsyncConsumptionRouter: FastifyPluginAsyncZod<
  MockAsyncConsumptionRouterOptions
> = async (fastify, { knodeId }) => {
  fastify.route({
    handler: async (req, res) => {
      const { logger } = getContextValues(requestContext);
      assertTokenClaimsAreValidForEservice(
        ASYNC_CONSUMPTION_MOCK_ESERVICE_ID,
        ASYNC_CONSUMPTION_MOCK_ESERVICE_VERSION_ID,
        ASYNC_CONSUMPTION_MOCK_PRODUCER_ID,
        knodeId,
      );

      const requestId = randomUUID();
      addAsyncCompanyAddressesRequest(requestId, req.body);

      logger.info(
        `Mock e-service company addresses requested. Generated request ID: ${requestId}`,
      );
      res.status(200).send({ requestId });
    },
    method: "POST",
    schema: {
      body: API_CompanyAddressesRequest,
      description:
        "Request the addresses of a list of companies identified by their UID (Cross-Border E-service 05, Request company addresses). The Producer will process the request asynchronously and the Consumer can retrieve the results later.",
      operationId: "requestCompanyAddresses",
      response: {
        200: z.strictObject({
          requestId: API_AsyncConsumptionRequestId,
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        429: API_Problem.meta({ description: "Too Many Requests" }),
      },
      summary: "Request company addresses",
      tags: [apiTags.asyncCompanyAddresses],
    },
    url: "/legal-entities/address-requests",
  });

  fastify.route({
    handler: async (req, res) => {
      const { logger } = getContextValues(requestContext);
      assertTokenClaimsAreValidForEservice(
        ASYNC_CONSUMPTION_MOCK_ESERVICE_ID,
        ASYNC_CONSUMPTION_MOCK_ESERVICE_VERSION_ID,
        ASYNC_CONSUMPTION_MOCK_PRODUCER_ID,
        knodeId,
      );

      const requestId = req.params.requestId;
      const request = getAsyncCompanyAddressesRequest(requestId);
      const state = getAsyncCompanyAddressesRequestState(request);

      logger.info(
        `Mock e-service company addresses request state requested. State for request ID ${requestId}: ${state}.`,
      );

      addAsyncCompanyAddressesResult(request);

      res
        .status(200)
        .send(
          toAPI_GetCompanyAddressesRequestStateResponse(
            state,
            request.resourceId,
          ),
        );
    },
    method: "GET",
    schema: {
      description:
        "Get the state of a previously requested company addresses request (Cross-Border E-service 05, Get company addresses). The Producer will return the state of the request, indicating whether it has been completed or is still pending. If the request has been completed, the Consumer can then retrieve the results through a separate endpoint using the resource ID.",
      operationId: "getCompanyAddressesRequestState",
      params: z.strictObject({
        requestId: API_AsyncConsumptionRequestId,
      }),
      response: {
        200: API_GetCompanyAddressesRequestStateResponse,
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        404: API_Problem.meta({ description: "Request Not Found" }),
        429: API_Problem.meta({ description: "Too Many Requests" }),
      },
      summary: "Get company addresses request state",
      tags: [apiTags.asyncCompanyAddresses],
    },
    url: "/legal-entities/address-requests/:requestId",
  });

  fastify.route({
    handler: async (req, res) => {
      const { logger } = getContextValues(requestContext);
      assertTokenClaimsAreValidForEservice(
        ASYNC_CONSUMPTION_MOCK_ESERVICE_ID,
        ASYNC_CONSUMPTION_MOCK_ESERVICE_VERSION_ID,
        ASYNC_CONSUMPTION_MOCK_PRODUCER_ID,
        knodeId,
      );

      const requestId = req.params.requestId;
      const resourceId = req.params.resourceId;
      getAsyncCompanyAddressesRequest(requestId);
      const results = getAsyncCompanyAddressesResults(resourceId);

      logger.info(
        `Mock e-service company addresses request results requested. Request ID: ${requestId}, Resource ID: ${resourceId}.`,
      );

      res.status(200).send(results);
    },
    method: "GET",
    schema: {
      description:
        "Get the results of a previously requested company addresses request (Cross-Border E-service 05, Get company addresses). The Producer will return the results of the request, including the addresses of the requested companies. The Consumer must provide the resource ID obtained from the previous request to retrieve the results.",
      operationId: "getCompanyAddressesResults",
      params: z.strictObject({
        requestId: API_AsyncConsumptionRequestId,
        resourceId: API_AsyncConsumptionResourceId,
      }),
      response: {
        200: API_GetCompanyAddressesResults,
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        404: API_Problem.meta({ description: "Not Found" }),
        429: API_Problem.meta({ description: "Too Many Requests" }),
      },
      summary: "Get company addresses results",
      tags: [apiTags.asyncCompanyAddresses],
    },
    url: "/legal-entities/address-requests/:requestId/resources/:resourceId",
  });
};
