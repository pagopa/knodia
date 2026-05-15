import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { unsafeBrandId } from "@knodia/common-models/ids";
import { validateAuthorization } from "@knodia/fastify-zod-api-commons/auth";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import { API_Problem } from "@knodia/fastify-zod-api-commons/models";

import type { SignalHubService } from "../services/signalHubService.ts";

import { API_PushResponse, API_PushSeed } from "../models/api.ts";
import { toSignalType } from "../models/apiConverter.ts";
import { apiTags } from "../models/apiTags.ts";

interface SignalHubRouterOptions {
  signalHubService: SignalHubService;
}

export const signalHubRouter: FastifyPluginAsyncZod<
  SignalHubRouterOptions
> = async (fastify, { signalHubService }) => {
  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "knode-api" },
      ]);
      const {
        authData: { organization },
        logger,
      } = ctx;

      logger.info(
        `Push signal request received from organization ${organization.id} (knode ${organization.knodeId})`,
      );

      const { eserviceId, objectId, objectType, signalId, signalType } =
        req.body;

      await signalHubService.pushSignal(
        {
          eserviceId: unsafeBrandId(eserviceId),
          objectId,
          objectType,
          signalId,
          signalType: toSignalType(signalType),
        },
        ctx,
      );

      res.status(200).send({ signalId });
    },
    method: "POST",
    schema: {
      body: API_PushSeed,
      description: "Push a signal for an E-service",
      operationId: "pushSignal",
      response: {
        200: API_PushResponse.meta({
          description: "Signal accepted",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Not Found" }),
        409: API_Problem.meta({ description: "Conflict" }),
      },
      summary: "Push Signal",
      tags: [apiTags.signalHub],
    },
    url: "/signals",
  });
};
