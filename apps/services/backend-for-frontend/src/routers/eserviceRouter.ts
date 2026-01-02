import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { catalogClient, getEservices } from "@knodia/eservice-models";

import { API_Eservices, API_EservicesQueryParams } from "../models/api.ts";

export const eserviceRouter: FastifyPluginAsyncZod = async (fastify) => {
  fastify.route({
    handler: async (req, res) => {
      const eservices = await getEservices({
        client: catalogClient,
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
      },
      tags: ["eservice"],
    },
    url: "/eservices",
  });
};
