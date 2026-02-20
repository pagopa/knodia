import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import { API_Problem } from "@knodia/fastify-zod-api-commons/models";
import z from "zod";

import { apiTags } from "../models/apiTags.ts";
import { unauthorizedError } from "../models/errors.ts";
import { type authorizationServiceBuilder } from "../services/authorizationService.ts";

interface AuthRouterOptions {
  authorizationService: ReturnType<typeof authorizationServiceBuilder>;
}

const API_SessionResponse = z.object({
  organizationId: z.string(),
  roles: z.array(z.string()),
  uiSessionToken: z.string(),
  userId: z.string(),
});

export const authRouter: FastifyPluginAsyncZod<AuthRouterOptions> = async (
  fastify,
  { authorizationService },
) => {
  fastify.route({
    handler: async (req, res) => {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        throw unauthorizedError("Missing or invalid Authorization header");
      }

      const { logger } = getContextValues(requestContext);

      const cognitoToken = authHeader.slice("Bearer ".length);

      try {
        const claims =
          await authorizationService.validateCognitoToken(cognitoToken);

        const uiSessionToken =
          await authorizationService.generateUISessionToken(claims);

        res.send({
          organizationId: claims.organizationId,
          roles: claims.roles,
          uiSessionToken,
          userId: claims.sub,
        });
      } catch (error) {
        logger.error(error, "Failed to validate Cognito token");
        throw unauthorizedError("Invalid or expired token");
      }
    },
    method: "GET",
    schema: {
      description: "Validate a Cognito token and generate a session token",
      operationId: "createSession",
      response: {
        200: API_SessionResponse.meta({
          description: "Session created successfully",
        }),
        401: API_Problem.meta({ description: "Unauthorized" }),
      },
      tags: [apiTags.auth],
    },
    url: "/auth/ui-session",
  });
};
