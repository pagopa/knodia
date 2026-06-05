import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { unsafeBrandExternalId } from "@knodia/common-models/externalResource";
import { KnodeId, type OrganizationId } from "@knodia/common-models/ids";
import { validateAuthorization } from "@knodia/fastify-zod-api-commons/auth";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import { API_Problem } from "@knodia/fastify-zod-api-commons/models";
import { API_OrganizationIdPathParam } from "@knodia/organization-models/api";

import type { OrganizationService } from "../services/organizationService.ts";

import { apiTags } from "../models/apiTags.ts";
import {
  API_GetOrganizationQueryParams,
  API_GetOrganizationsQueryParams,
  API_Organization,
  API_Organizations,
} from "../models/organization/api.ts";

interface OrganizationRouterOptions {
  organizationService: OrganizationService;
}

export const organizationRouter: FastifyPluginAsyncZod<
  OrganizationRouterOptions
> = async (fastify, { organizationService }) => {
  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative", "technical"] },
        { scope: "agreement-activation", tokenType: "external-ui-session" },
      ]);

      const data = await organizationService.getOrganization(
        unsafeBrandExternalId<OrganizationId>(req.params.organizationId),
        KnodeId.parse(req.query.knodeId),
        ctx,
      );

      res.send(data);
    },
    method: "GET",
    schema: {
      description: "Retrieve an Organization by its ID",
      operationId: "getOrganization",
      params: API_OrganizationIdPathParam,
      querystring: API_GetOrganizationQueryParams,
      response: {
        200: API_Organization.meta({
          description: "Organization retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Organization not found" }),
      },
      summary: "Get Organization",
      tags: [apiTags.organization],
    },
    url: "/organizations/:organizationId",
  });

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative", "technical"] },
      ]);

      const data = await organizationService.getOrganizations(req.query, ctx);

      res.send(data);
    },
    method: "GET",
    schema: {
      description: "Retrieve a list of Organizations",
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
      summary: "List Organizations",
      tags: [apiTags.organization],
    },
    url: "/organizations",
  });
};
