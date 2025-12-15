import { API_EServices, API_EServicesQueryParams } from "../models/api.ts";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { getMockEServices } from "../services/eserviceService.ts";
import { toAPI_EService } from "../models/apiConverter.ts";

export const eserviceRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.route({
    method: "GET",
    url: "/eservices",
    schema: {
      querystring: API_EServicesQueryParams,
      response: {
        200: API_EServices,
      },
    },
    handler: (req, res) => {
      const eservices = getMockEServices(req.query.offset, req.query.limit);
      res.send({
        items: eservices.items.map(toAPI_EService),
        pagination: eservices.pagination,
      });
    },
  });
};
