import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { Problem } from "@knodia/error-commons";

import { API_Eservices, API_EservicesQueryParams } from "../models/api.ts";
import { toAPI_Eservice } from "../models/apiConverter.ts";
import { makeApiProblem } from "../models/errors.ts";
import { eserviceErrorMapper } from "../services/errorMappers.ts";
import { getMockEservices } from "../services/eserviceService.ts";

export const eserviceRouter: FastifyPluginAsyncZod = async (fastify) => {
  fastify.route({
    errorHandler: (error, _req, res) => {
      const errorRes = makeApiProblem(error, eserviceErrorMapper);

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
      operationId: "getEservices",
      querystring: API_EservicesQueryParams,
      response: {
        200: API_Eservices,
        400: Problem,
      },
      tags: ["eservice"],
    },
    url: "/eservices",
  });
};
