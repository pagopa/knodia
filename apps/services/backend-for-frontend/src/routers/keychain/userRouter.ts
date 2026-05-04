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
import { API_OrganizationUsers } from "../../models/keychain/api.ts";
import { toAPI_OrganizationUser } from "../../models/keychain/apiConverter.ts";

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

      logger.info("Getting users of the requesting organization");

      const { data } = await keychainProcessApi.getOrganizationUsers({
        client: keychainProcessClient,
        headers: getKnodiaServiceHeaders(req, correlationId),
      });

      res.send(data.map(toAPI_OrganizationUser));
    },
    method: "GET",
    schema: {
      description:
        "Retrieve users of the requesting User's Organization, including whether they have the technical role",
      operationId: "getOrganizationUsers",
      response: {
        200: API_OrganizationUsers.meta({
          description: "Organization Users retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
      },
      tags: [apiTags.user],
    },
    url: "/users",
  });
};
