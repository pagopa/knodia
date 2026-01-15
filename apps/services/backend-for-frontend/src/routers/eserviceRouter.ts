import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { emptyErrorMapper, Problem, serviceName } from "@knodia/error-commons";
import { eserviceProcessApi } from "@knodia/eservice-process-client";

import { type EserviceProcessClient } from "../clients/clientsProvider.ts";
import { API_Eservices, API_EservicesQueryParams } from "../models/api.ts";
import { makeApiProblem } from "../models/errors.ts";

export const eserviceRouter: FastifyPluginAsyncZod<
  EserviceProcessClient
> = async (fastify, eserviceProcessClient) => {
  fastify.route({
    errorHandler: (error, req, res) => {
      // TODO: fix context
      const errorRes = makeApiProblem(error, emptyErrorMapper, {
        correlationId: req.id,
        logger: req.log,
        serviceName: serviceName.BACKEND_FOR_FRONTEND,
      });

      res.statusCode = errorRes.status;

      return res.type("application/problem+json").send(errorRes);
    },
    handler: async (req, res) => {
      const eservices = await eserviceProcessApi.getEservices({
        client: eserviceProcessClient,
        query: {
          limit: req.query.limit,
          offset: req.query.offset,
        },
      });

      res.send({
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
      operationId: "getEservices",
      querystring: API_EservicesQueryParams,
      response: {
        200: API_Eservices,
        404: Problem,
      },
      tags: ["eservice"],
    },
    url: "/eservices",
  });
};
