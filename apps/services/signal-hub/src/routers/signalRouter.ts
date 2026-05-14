import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { validateAuthorization } from "@knodia/fastify-zod-api-commons/auth";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import {
  API_Problem,
  KnodiaServiceHeaders,
} from "@knodia/fastify-zod-api-commons/models";
import z from "zod";

import { API_SignalSeed } from "../models/api.ts";
import { apiTags } from "../models/apiTags.ts";

export const signalRouter: FastifyPluginAsyncZod = async (fastify) => {
  fastify.route({
    handler: async (_req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "knode-api" },
      ]);

      ctx.logger.info(
        `Push signal request received from keychain ${ctx.authData.keychain.id}`,
      );

      res.status(204).send();
    },
    method: "POST",
    schema: {
      body: API_SignalSeed,
      description: "Push a signal for an E-service",
      headers: KnodiaServiceHeaders,
      operationId: "pushSignal",
      response: {
        204: z.undefined().meta({ description: "Signal accepted" }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
      },
      tags: [apiTags.signalHub],
    },
    url: "/signals",
  });
};
