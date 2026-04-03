import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import {
  API_Problem,
  getKnodiaServiceHeaders,
} from "@knodia/fastify-zod-api-commons/models";
import {
  keychainProcessApi,
  type KeychainProcessClient,
} from "@knodia/keychain-process-client";

import { apiTags } from "../../models/apiTags.ts";
import { API_Users } from "../../models/keychain/api.ts";
import { toAPI_User } from "../../models/keychain/apiConverter.ts";

interface UserRouterOptions {
  keychainProcessClient: KeychainProcessClient;
}

export const userRouter: FastifyPluginAsyncZod<UserRouterOptions> = async (
  fastify,
  { keychainProcessClient },
) => {
  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info("Getting technical users of the requesting organization");

      const { data } = await keychainProcessApi.getTechnicalUsers({
        client: keychainProcessClient,
        headers: getKnodiaServiceHeaders(req, correlationId),
      });

      res.send(data.map(toAPI_User));
    },
    method: "GET",
    schema: {
      description:
        "Retrieve technical users of the requesting User's Organization",
      operationId: "getTechnicalUsers",
      response: {
        200: API_Users.meta({
          description: "Technical Users retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
      },
      tags: [apiTags.user],
    },
    url: "/users/technical",
  });
};
