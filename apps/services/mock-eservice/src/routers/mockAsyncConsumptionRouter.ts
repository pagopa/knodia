import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { type KnodeId } from "@knodia/common-models/ids";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import { API_Problem } from "@knodia/fastify-zod-api-commons/models";
import { randomUUID } from "crypto";
import z from "zod";

import {
  addAsyncCompanyAddressesRequest,
  getAsyncCompanyAddressesRequestStatus,
} from "../asyncConsumption/asyncConsumptionRequests.ts";
import {
  ASYNC_CONSUMPTION_MOCK_ESERVICE_ID,
  ASYNC_CONSUMPTION_MOCK_ESERVICE_VERSION_ID,
  ASYNC_CONSUMPTION_MOCK_PRODUCER_ID,
} from "../asyncConsumption/mockup.ts";
import {
  API_AsyncConsumptionRequestId,
  API_CompanyAddressesRequest,
  API_GetCompanyAddressesRequestStatusResponse,
} from "../models/api.ts";
import { toAPI_GetCompanyAddressesRequestStatusResponse } from "../models/apiConverter.ts";
import { apiTags } from "../models/apiTags.ts";
import { assertTokenClaimsAreValidForEservice } from "../utils/validators.ts";

interface MockAsyncConsumptionRouterOptions {
  knodeId: KnodeId;
}

export const mockAsyncConsumptionRouter: FastifyPluginAsyncZod<
  MockAsyncConsumptionRouterOptions
> = async (fastify, { knodeId }) => {
  fastify.route({
    handler: async (_req, res) => {
      const { logger } = getContextValues(requestContext);
      assertTokenClaimsAreValidForEservice(
        ASYNC_CONSUMPTION_MOCK_ESERVICE_ID,
        ASYNC_CONSUMPTION_MOCK_ESERVICE_VERSION_ID,
        ASYNC_CONSUMPTION_MOCK_PRODUCER_ID,
        knodeId,
      );

      const requestId = randomUUID();
      addAsyncCompanyAddressesRequest(requestId);

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
      const requestStatus = getAsyncCompanyAddressesRequestStatus(requestId);

      logger.info(
        `Mock e-service company addresses request status requested. Status for request ID ${requestId}: ${requestStatus}.`,
      );

      res
        .status(200)
        .send(toAPI_GetCompanyAddressesRequestStatusResponse(requestStatus));
    },
    method: "GET",
    schema: {
      description:
        "Get the status of a previously requested company addresses request (Cross-Border E-service 05, Get company addresses). The Producer will return the status of the request, indicating whether it has been completed or is still pending. If the request has been completed, the Consumer can then retrieve the results through a separate endpoint using the resource ID.",
      operationId: "getCompanyAddressesRequestStatus",
      params: z.strictObject({
        requestId: API_AsyncConsumptionRequestId,
      }),
      response: {
        200: API_GetCompanyAddressesRequestStatusResponse,
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        404: API_Problem.meta({ description: "Request not found" }),
        429: API_Problem.meta({ description: "Too Many Requests" }),
      },
      summary: "Get company addresses request status",
      tags: [apiTags.asyncCompanyAddresses],
    },
    url: "/legal-entities/address-requests/:requestId",
  });
};
