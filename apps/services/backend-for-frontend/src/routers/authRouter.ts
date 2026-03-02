import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { API_Problem } from "@knodia/fastify-zod-api-commons/models";
import z from "zod";

import { apiTags } from "../models/apiTags.ts";
import { type authServiceBuilder } from "../services/authService.ts";

interface AuthRouterOptions {
  authService: ReturnType<typeof authServiceBuilder>;
}

const API_SessionRequest = z
  .strictObject({
    oidcToken: z.string(),
  })
  .meta({ id: "SessionRequest" });

const API_SessionResponse = z
  .object({
    refreshToken: z.string(),
    uiSessionToken: z.string(),
  })
  .meta({ id: "SessionResponse" });

const API_RefreshRequest = z
  .strictObject({
    refreshToken: z.string(),
  })
  .meta({ id: "RefreshRequest" });

export const authRouter: FastifyPluginAsyncZod<AuthRouterOptions> = async (
  fastify,
  { authService },
) => {
  fastify.route({
    handler: async (req, res) => {
      const tokens = await authService.generateUISessionTokenPair(
        req.body.oidcToken,
      );
      res.send(tokens);
    },
    method: "POST",
    schema: {
      body: API_SessionRequest,
      description: "Validate a Cognito token and generate a session token",
      operationId: "createSession",
      response: {
        200: API_SessionResponse.meta({
          description: "Session created successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
      },
      tags: [apiTags.auth],
    },
    url: "/auth/ui-session",
  });

  fastify.route({
    handler: async (req, res) => {
      const tokens = await authService.refreshUISessionTokenPair(
        req.body.refreshToken,
      );
      res.send(tokens);
    },
    method: "POST",
    schema: {
      body: API_RefreshRequest,
      description: "Refresh an expired UI session token using a refresh token",
      operationId: "refreshSession",
      response: {
        200: API_SessionResponse.meta({
          description: "Session refreshed successfully",
        }),
        401: API_Problem.meta({ description: "Unauthorized" }),
      },
      tags: [apiTags.auth],
    },
    url: "/auth/ui-session/refresh",
  });
};
