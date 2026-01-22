import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import type { OpenAPIV3 } from "openapi-types";

import { requestContext } from "@fastify/request-context";
import { constants } from "http2";

import { getContextValues } from "../context/context.ts";
import { API_Problem } from "../models/api.ts";
import { retrieveServiceErrorCode } from "../utils/problemBuilder.ts";

export const healthRouterTag: OpenAPIV3.TagObject = {
  description: "Health check routes",
  name: "health",
};

const title = "Service status OK";

export const healthRouter: FastifyPluginAsyncZod = async (fastify) => {
  fastify.route({
    handler: (_req, res) => {
      const { correlationId, serviceName } = getContextValues(requestContext);

      const healthProblem: API_Problem = {
        correlationId,
        errors: [
          {
            code: `${retrieveServiceErrorCode(serviceName)}-0000`,
            detail: "The service is healthy",
          },
        ],
        status: constants.HTTP_STATUS_OK,
        title,
      };

      res.status(200).send(healthProblem);
    },
    method: "GET",
    schema: {
      description: "Check the health status of the service",
      operationId: "getStatus",
      response: {
        200: API_Problem.describe(title),
      },
      tags: [healthRouterTag.name],
    },
    url: "/status",
  });
};
