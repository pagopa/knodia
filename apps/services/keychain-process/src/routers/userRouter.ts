import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { validateAuthorization } from "@knodia/fastify-zod-api-commons/auth";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import {
  API_Problem,
  KnodiaServiceHeaders,
} from "@knodia/fastify-zod-api-commons/models";

import type { UserService } from "../services/userService.ts";

import { API_Users } from "../models/api.ts";
import { toAPI_User } from "../models/apiConverter.ts";
import { apiTags } from "../models/apiTags.ts";

export const userRouter: FastifyPluginAsyncZod<UserService> = async (
  fastify,
  userService,
) => {
  fastify.route({
    handler: async (_req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative", "technical"] },
      ]);

      try {
        const technicalUsers = await userService.getOrganizationTechnicalUsers(
          ctx.authData.organizationId,
        );
        res.status(200).send(technicalUsers.map(toAPI_User));
      } catch (error) {
        console.log(error);
        throw error;
      }
    },
    method: "GET",
    schema: {
      description:
        "Retrieve technical users of the requesting user's organization",
      headers: KnodiaServiceHeaders,
      operationId: "getTechnicalUsers",
      response: {
        200: API_Users.meta({
          description: "Technical users retrieved successfully",
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
