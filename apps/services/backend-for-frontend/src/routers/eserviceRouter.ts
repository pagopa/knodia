import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { emptyErrorMapper, Problem } from "@knodia/error-commons";
import { eserviceProcessApi } from "@knodia/eservice-process-client";

import { type EserviceProcessClient } from "../clients/clientsProvider.ts";
import { API_Eservices, API_EservicesQueryParams } from "../models/api.ts";
import { apiTags } from "../models/apiTags.ts";
import { makeApiProblem } from "../models/errors.ts";

export const eserviceRouter: FastifyPluginAsyncZod<
  EserviceProcessClient
> = async (fastify, eserviceProcessClient) => {
  fastify.route({
    errorHandler: (error, _req, res) => {
      const errorRes = makeApiProblem(error, emptyErrorMapper);

      res.statusCode = errorRes.status;

      return res.type("application/problem+json").send(errorRes);
    },
    handler: async (req, res) => {
      const eservices = await eserviceProcessApi.getEservices({
        client: eserviceProcessClient,
        headers: {
          "X-Correlation-ID": requestContext.get("correlationId"),
        },
        query: {
          limit: req.query.limit,
          offset: req.query.offset,
        },
      });

      res.send({
        // TODO move this defaulting logic to the service, keep routers only for routing
        // and API models conversion, no logic
        items: eservices.data?.items || [],
        pagination: eservices.data?.pagination || {
          limit: req.query.limit,
          offset: req.query.offset,
          total: 0,
        },
      });
    },
    method: "GET",
    schema: {
      description: "Retrieve a list of E-services",
      operationId: "getEservices",
      querystring: API_EservicesQueryParams,
      response: {
        200: API_Eservices.describe("E-services retrieved successfully"),
        400: Problem.describe("Bad Request"),
      },
      tags: [apiTags.eservice],
    },
    url: "/eservices",
  });
};
