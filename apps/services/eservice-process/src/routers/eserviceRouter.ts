import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { Problem } from "@knodia/error-commons";

import { API_Eservices, API_EservicesQueryParams } from "../models/api.ts";
import { toAPI_Eservice } from "../models/apiConverter.ts";
import { makeApiProblem } from "../models/errors.ts";
import { eserviceErrorMapper } from "../services/errorMappers.ts";
import { getMockEservices } from "../services/eserviceService.ts";

export const eserviceRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.route({
    errorHandler: (error, req, res) => {
      // TODO: fix context
      const errorRes = makeApiProblem(error, eserviceErrorMapper, {
        correlationId: req.id,
        logger: req.log,
        serviceName: "eservice-process",
      });

      res.statusCode = errorRes.status;
      return res.type("application/problem+json").send(errorRes);
    },
    handler: (req, res) => {
      const eservices = getMockEservices(req.query.offset, req.query.limit);
      res.send({
        items: eservices.items.map(toAPI_Eservice),
        pagination: eservices.pagination,
      });
    },
    method: "GET",
    schema: {
      querystring: API_EservicesQueryParams,
      response: {
        200: API_Eservices,
        400: Problem,
      },
    },
    url: "/eservices",
  });
};
