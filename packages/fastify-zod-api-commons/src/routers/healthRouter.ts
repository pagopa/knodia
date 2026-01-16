import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import type { OpenAPIV3 } from "openapi-types";

import z from "zod";

export const healthRouterTag: OpenAPIV3.TagObject = {
  description: "Health check routes",
  name: "health",
};

export const healthRouter: FastifyPluginAsyncZod = async (fastify) => {
  fastify.route({
    handler: (_req, res) => {
      res.send();
    },
    method: "GET",
    schema: {
      description: "Check the health status of the service",
      operationId: "getStatus",
      response: {
        200: z.void().describe("Service status OK"),
      },
      tags: [healthRouterTag.name],
    },
    url: "/status",
  });
};
