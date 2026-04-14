import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import { API_Problem } from "@knodia/fastify-zod-api-commons/models";

import { API_TokenRequest, API_TokenResponse } from "../models/api.ts";
import { apiTags } from "../models/apiTags.ts";
import { type tokenServiceBuilder } from "../services/tokenService.ts";

interface TokenRouterOptions {
  clientAssertionAcceptedAudiences: string[];
  tokenService: ReturnType<typeof tokenServiceBuilder>;
}

export const tokenRouter: FastifyPluginAsyncZod<TokenRouterOptions> = async (
  fastify,
  { clientAssertionAcceptedAudiences, tokenService },
) => {
  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info(
        { correlationId, requestBody: req.body },
        "Issuing mocked access token",
      );

      const token = await tokenService.issueToken(
        req.body,
        clientAssertionAcceptedAudiences,
      );

      res.send(token);
    },
    method: "POST",
    schema: {
      body: API_TokenRequest,
      description: "Issue a mocked access token",
      operationId: "createToken",
      response: {
        200: API_TokenResponse.meta({
          description: "Token issued successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
      },
      security: [],
      summary: "Create Token",
      tags: [apiTags.token],
    },
    url: "/token",
  });
};
