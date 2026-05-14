import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { validateAuthorization } from "@knodia/fastify-zod-api-commons/auth";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import { API_Problem } from "@knodia/fastify-zod-api-commons/models";
import z from "zod";

import { apiTags } from "../models/apiTags.ts";

export const signalRouter: FastifyPluginAsyncZod = async (fastify) => {
  fastify.route({
    handler: async (_req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "knode-api" },
      ]);

      ctx.logger.info(
        `Push signal request received from organization ${ctx.authData.organization.id} (knode ${ctx.authData.organization.knodeId})`,
      );

      res.status(501).send();
    },
    method: "POST",
    schema: {
      description: "Push a signal for an E-service",
      operationId: "pushSignal",
      response: {
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        501: z.undefined().meta({ description: "Not implemented" }),
      },
      tags: [apiTags.signalHub],
    },
    url: "/signals",
  });
};
