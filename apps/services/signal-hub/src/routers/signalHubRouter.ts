import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { unsafeBrandId } from "@knodia/common-models/ids";
import { API_EserviceIdPathParam } from "@knodia/eservice-models/api";
import { validateAuthorization } from "@knodia/fastify-zod-api-commons/auth";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import { API_Problem } from "@knodia/fastify-zod-api-commons/models";

import type { SignalHubService } from "../services/signalHubService.ts";

import {
  API_PullResponse,
  API_PullSignalsQueryParams,
  API_PushResponse,
  API_Signal,
} from "../models/api.ts";
import { toAPI_PullResponse, toSignalType } from "../models/apiConverter.ts";
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
        { scope: "producer", tokenType: "knode-api" },
      ]);
      const {
        authData: { organization },
        logger,
      } = ctx;

      logger.info(
        `Push signal request received from organization ${organization.id} (Knode ${organization.knodeId})`,
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
      body: API_Signal,
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

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { scope: "consumer", tokenType: "knode-api" },
      ]);
      const {
        authData: { organization },
        logger,
      } = ctx;

      const { eserviceId } = req.params;
      const { lastSignalId: signalId, size } = req.query;

      logger.info(
        {
          request: { query: req.query },
        },
        `Pull signals request received for E-service ${eserviceId} from organization ${organization.id} (Knode ${organization.knodeId})`,
      );

      const { hasMoreSignals, lastSignalId, signals } =
        await signalHubService.pullSignals(
          {
            eserviceId,
            signalId,
            size,
          },
          ctx,
        );

      const response = toAPI_PullResponse(lastSignalId, signals);

      res.status(hasMoreSignals ? 206 : 200).send(response);
    },
    method: "GET",
    schema: {
      description: "Pull a list of signals for an E-service",
      operationId: "pullSignals",
      params: API_EserviceIdPathParam,
      querystring: API_PullSignalsQueryParams,
      response: {
        200: API_PullResponse.meta({
          description: "Signals pulled successfully",
        }),
        206: API_PullResponse.meta({
          description:
            "Signals pulled successfully, but there are more signals to pull",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Not Found" }),
        409: API_Problem.meta({ description: "Conflict" }),
      },
      summary: "Pull Signals",
      tags: [apiTags.signalHub],
    },
    url: "/signals/:eserviceId",
  });
};
