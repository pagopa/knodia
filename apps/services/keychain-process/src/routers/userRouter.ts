import type { IdmClient } from "@knodia/idm-client";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { validateAuthorization } from "@knodia/fastify-zod-api-commons/auth";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import {
  API_Problem,
  KnodiaServiceHeaders,
} from "@knodia/fastify-zod-api-commons/models";

import { API_OrganizationUsers } from "../models/api.ts";
import { toAPI_OrganizationUser } from "../models/apiConverter.ts";
import { apiTags } from "../models/apiTags.ts";

export const userRouter: FastifyPluginAsyncZod<IdmClient> = async (
  fastify,
  idmClient,
) => {
  fastify.route({
    handler: async (_req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative", "technical"] },
      ]);

      const organizationUsers = await idmClient.getOrganizationUsers(
        ctx.authData.organizationId,
      );

      res.status(200).send(organizationUsers.map(toAPI_OrganizationUser));
    },
    method: "GET",
    schema: {
      description:
        "Retrieve users of the requesting User's Organization, including whether they have the technical role",
      headers: KnodiaServiceHeaders,
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
