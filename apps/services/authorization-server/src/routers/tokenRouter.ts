import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { unsafeBrandId } from "@knodia/common-models/ids";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import { API_Problem } from "@knodia/fastify-zod-api-commons/models";

import type { AuthorizationServerConfig } from "../config/config.ts";

import { API_TokenRequest, API_TokenResponse } from "../models/api.ts";
import { apiTags } from "../models/apiTags.ts";
import { type TokenService } from "../services/tokenService.ts";

interface TokenRouterOptions {
  config: AuthorizationServerConfig;
  tokenService: TokenService;
}

export const tokenRouter: FastifyPluginAsyncZod<TokenRouterOptions> = async (
  fastify,
  { config, tokenService },
) => {
  fastify.route({
    handler: async (req, res) => {
      const {
        clientAssertionAcceptedAudiences,
        clientAssertionClockToleranceSeconds,
        clientAssertionMaxTokenAgeSeconds,
      } = config;
      const { correlationId, logger } = getContextValues(requestContext);
      const { client_assertion_type, client_id, grant_type } = req.body;

      logger.info(
        {
          correlationId,
          requestBody: { client_assertion_type, client_id, grant_type }, // Only log non-sensitive parts of the request body
        },
        "Issuing an E-service access token",
      );

      const token = await tokenService.issueToken(
        {
          clientAssertionJWS: req.body.client_assertion,
          consumerKeychainId: unsafeBrandId(req.body.client_id),
        },
        clientAssertionAcceptedAudiences,
        clientAssertionClockToleranceSeconds,
        clientAssertionMaxTokenAgeSeconds,
        logger,
      );

      res.send(token);
    },
    method: "POST",
    schema: {
      body: API_TokenRequest,
      consumes: ["application/x-www-form-urlencoded"],
      description: "Issue an E-service access token",
      operationId: "createToken",
      response: {
        200: API_TokenResponse.meta({
          description: "Token issued successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
      },
      security: [],
      summary: "Create Token",
      tags: [apiTags.token],
    },
    url: "/token",
  });
};
