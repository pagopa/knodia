import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import z from "zod";

// TODO move to a common package, since it will be used by multiple services
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
      tags: ["health"],
    },
    url: "/status",
  });
};
