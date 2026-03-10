import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { validateAuthorization } from "@knodia/fastify-zod-api-commons/auth";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import {
  API_Problem,
  KnodiaServiceHeaders,
} from "@knodia/fastify-zod-api-commons/models";

import type { OrganizationService } from "../services/organizationService.ts";

import {
  API_GetOrganizationsQueryParams,
  API_Organizations,
} from "../models/api.ts";
import { toAPI_Organization } from "../models/apiConverter.ts";
import { apiTags } from "../models/apiTags.ts";

export const organizationRouter: FastifyPluginAsyncZod<
  OrganizationService
> = async (fastify, organizationService) => {
  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative", "technical"] },
      ]);

      const { results, totalCount } =
        await organizationService.getOrganizations(req.query, ctx);

      res.status(200).send({
        items: results.map(toAPI_Organization),
        pagination: {
          limit: req.query.limit,
          offset: req.query.offset,
          total: totalCount,
        },
      });
    },
    method: "GET",
    schema: {
      description: "Retrieve a list of Organizations",
      headers: KnodiaServiceHeaders,
      operationId: "getOrganizations",
      querystring: API_GetOrganizationsQueryParams,
      response: {
        200: API_Organizations.meta({
          description: "Organizations retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
      },
      tags: [apiTags.organization],
    },
    url: "/organizations",
  });
};
