import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { eserviceProcessApi } from "@knodia/eservice-process-client";

import { type EserviceProcessClient } from "../clients/clientsProvider.ts";
import { API_Eservices, API_EservicesQueryParams } from "../models/api.ts";

export const eserviceRouter: FastifyPluginAsyncZod<
  EserviceProcessClient
> = async (fastify, eserviceProcessClient) => {
  fastify.route({
    handler: async (req, res) => {
      const eservices = await eserviceProcessApi.getEservices({
        client: eserviceProcessClient,
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
        200: API_Eservices,
      },
      tags: ["eservice"],
    },
    url: "/eservices",
  });
};
