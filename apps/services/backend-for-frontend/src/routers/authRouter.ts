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
    uiSessionToken: z.string(),
  })
  .meta({ id: "SessionResponse" });

export const authRouter: FastifyPluginAsyncZod<AuthRouterOptions> = async (
  fastify,
  { authService },
) => {
  fastify.route({
    handler: async (req, res) => {
      const { oidcToken } = req.body;

      const uiSessionToken =
        await authService.generateUISessionToken(oidcToken);

      res.send({
        uiSessionToken,
      });
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
};
