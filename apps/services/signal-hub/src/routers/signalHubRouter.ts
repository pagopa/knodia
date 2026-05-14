import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { unsafeBrandId } from "@knodia/common-models/ids";
import { validateAuthorization } from "@knodia/fastify-zod-api-commons/auth";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import {
  API_Problem,
  KnodiaServiceHeaders,
} from "@knodia/fastify-zod-api-commons/models";
import z from "zod";

import type { SignalHubService } from "../services/signalHubService.ts";

import { API_PushSeed } from "../models/api.ts";
import { apiTags } from "../models/apiTags.ts";

interface SignalHubRouterOptions {
  signalHubService: SignalHubService;
  timeWindowInSeconds: number;
}

export const signalHubRouter: FastifyPluginAsyncZod<
  SignalHubRouterOptions
> = async (fastify, { signalHubService, timeWindowInSeconds }) => {
  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "knode-api" },
      ]);
      const { eserviceId, objectId, objectType, signalId, signalType } =
        req.body;

      await signalHubService.pushSignal(
        {
          eserviceId: unsafeBrandId(eserviceId),
          objectId,
          objectType,
          signalId,
          signalType,
          timeWindowInSeconds,
        },
        ctx,
      );

      res.status(200).send(signalId);
    },
    method: "POST",
    schema: {
      body: API_PushSeed,
      description: "Push new Signal to Signal Hub",
      headers: KnodiaServiceHeaders,
      operationId: "pushSignal",
      response: {
        200: z.number().meta({
          description: "Signal pushed successfully",
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
