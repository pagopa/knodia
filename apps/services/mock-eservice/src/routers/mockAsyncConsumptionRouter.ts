import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { type KnodeId } from "@knodia/common-models/ids";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import { API_Problem } from "@knodia/fastify-zod-api-commons/models";
import { randomUUID } from "crypto";
import z from "zod";

import { addAsyncCompanyAddressesRequest } from "../asyncConsumption/asyncConsumptionRequests.ts";
import {
  ASYNC_CONSUMPTION_MOCK_ESERVICE_ID,
  ASYNC_CONSUMPTION_MOCK_ESERVICE_VERSION_ID,
  ASYNC_CONSUMPTION_MOCK_PRODUCER_ID,
} from "../asyncConsumption/mockup.ts";
import { API_CompanyAddressesRequest } from "../models/api.ts";
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
          requestId: z.uuid(),
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
};
