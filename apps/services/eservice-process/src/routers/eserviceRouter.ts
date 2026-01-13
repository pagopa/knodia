import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { API_Eservices, API_EservicesQueryParams } from "../models/api.ts";
import { toAPI_Eservice } from "../models/apiConverter.ts";
import { getMockEservices } from "../services/eserviceService.ts";

export const eserviceRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.route({
    handler: (req, res) => {
      const eservices = getMockEservices(req.query.offset, req.query.limit);
      res.send({
        items: eservices.items.map(toAPI_Eservice),
        pagination: eservices.pagination,
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
