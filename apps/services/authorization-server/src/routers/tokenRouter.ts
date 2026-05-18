import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { unsafeBrandId } from "@knodia/common-models/ids";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import { API_Problem } from "@knodia/fastify-zod-api-commons/models";

import {
  API_EserviceAccessTokenRequest,
  API_EserviceAccessTokenResponse,
  API_KnodeApiTokenRequest,
  API_KnodeApiTokenResponse,
} from "../models/api.ts";
import { apiTags } from "../models/apiTags.ts";
import { AuthServerHeaders } from "../models/headers.ts";
import { type TokenService } from "../services/tokenService.ts";

interface TokenRouterOptions {
  tokenService: TokenService;
}

export const tokenRouter: FastifyPluginAsyncZod<TokenRouterOptions> = async (
  fastify,
  { tokenService },
) => {
  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);
      const { client_assertion, client_assertion_type, client_id, grant_type } =
        req.body;

      logger.info(
        {
          correlationId,
          requestBody: { client_assertion_type, client_id, grant_type }, // Only log non-sensitive parts of the request body
        },
        "Issuing an E-service access token",
      );

      const token = await tokenService.issueEserviceAccessToken(
        {
          clientAssertionJWS: client_assertion,
          consumerKeychainId: unsafeBrandId(client_id),
          dpopProofJWS: req.headers.dpop,
        },
        logger,
      );

      res.send(token);
    },
    method: "POST",
    schema: {
      body: API_EserviceAccessTokenRequest,
      consumes: ["application/x-www-form-urlencoded"],
      description: "Issue an E-service access token",
      headers: AuthServerHeaders,
      operationId: "createEserviceAccessToken",
      response: {
        200: API_EserviceAccessTokenResponse.meta({
          description: "Token issued successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
      },
      security: [],
      summary: "Create E-service Access Token",
      tags: [apiTags.eserviceAccessToken],
    },
    url: "/token",
  });

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);
      const { client_assertion, client_assertion_type, client_id, grant_type } =
        req.body;

      logger.info(
        {
          correlationId,
          requestBody: { client_assertion_type, client_id, grant_type },
        },
        "Issuing a Knode API access token",
      );

      const token = await tokenService.issueKnodeApiToken(
        {
          clientAssertionJWS: client_assertion,
          knodeApiKeychainId: unsafeBrandId(client_id),
        },
        logger,
      );

      res.send(token);
    },
    method: "POST",
    schema: {
      body: API_KnodeApiTokenRequest,
      consumes: ["application/x-www-form-urlencoded"],
      description: "Issue a Knode API access token",
      operationId: "createKnodeApiToken",
      response: {
        200: API_KnodeApiTokenResponse.meta({
          description: "Token issued successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
      },
      security: [],
      summary: "Create Knode API Token",
      tags: [apiTags.knodeApiToken],
    },
    url: "/knodeApiToken",
  });
};
