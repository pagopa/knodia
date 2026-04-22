import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import z from "zod";

import { API_TestResponse } from "../models/api.ts";
import { apiTags } from "../models/apiTags.ts";

const UnauthorizedResponse = z.object({ error: z.string() });

export const mockRouter: FastifyPluginAsyncZod = async (fastify) => {
  fastify.route({
    handler: async (_req, res) => {
      const { logger } = getContextValues(requestContext);
      logger.info("Mock e-service /test invoked with valid access token");
      res.status(200).send({ status: "ok" });
    },
    method: "GET",
    schema: {
      description:
        "Validates the incoming Bearer access token and returns a static success response",
      operationId: "test",
      response: {
        200: API_TestResponse.meta({ description: "Access token accepted" }),
        401: UnauthorizedResponse.meta({ description: "Unauthorized" }),
      },
      summary: "Mock e-service endpoint",
      tags: [apiTags.mock],
    },
    url: "/test",
  });
};
