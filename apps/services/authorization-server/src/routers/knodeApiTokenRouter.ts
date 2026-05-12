import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { unsafeBrandId } from "@knodia/common-models/ids";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import { API_Problem } from "@knodia/fastify-zod-api-commons/models";

import type { AuthorizationServerConfig } from "../config/config.ts";

import {
  API_KnodeApiTokenRequest,
  API_KnodeApiTokenResponse,
} from "../models/api.ts";
import { apiTags } from "../models/apiTags.ts";
import { type KnodeApiTokenService } from "../services/knodeApiTokenService.ts";

interface KnodeApiTokenRouterOptions {
  config: AuthorizationServerConfig;
  knodeApiTokenService: KnodeApiTokenService;
}

export const knodeApiTokenRouter: FastifyPluginAsyncZod<
  KnodeApiTokenRouterOptions
> = async (fastify, { config, knodeApiTokenService }) => {
  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);
      const { client_assertion_type, client_id, grant_type } = req.body;

      logger.info(
        {
          correlationId,
          requestBody: { client_assertion_type, client_id, grant_type },
        },
        "Issuing a Knode API access token",
      );

      const token = await knodeApiTokenService.issueKnodeApiToken(
        {
          clientAssertionJWS: req.body.client_assertion,
          knodeApiKeychainId: unsafeBrandId(req.body.client_id),
        },
        config,
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
      tags: [apiTags.token],
    },
    url: "/knodeApiToken",
  });
};
