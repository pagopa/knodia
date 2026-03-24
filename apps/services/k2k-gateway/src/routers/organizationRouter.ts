import type { RefreshableInternalTokenGenerator } from "@knodia/token-generator/refreshable";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import { API_Problem } from "@knodia/fastify-zod-api-commons/models";
import {
  organizationProcessApi,
  type OrganizationProcessClient,
} from "@knodia/organization-process-client";

import { apiTags } from "../models/apiTags.ts";
import {
  API_GetOrganizationsQueryParams,
  API_Organization,
  API_OrganizationIdPathParam,
  API_Organizations,
} from "../models/organization/api.ts";
import { toAPI_Organization } from "../models/organization/apiConverters.ts";
import { getKnodiaServiceHeaders } from "../utils/headers.ts";

interface OrganizationRouterOptions {
  organizationProcessClient: OrganizationProcessClient;
  tokenProvider: RefreshableInternalTokenGenerator;
}

export const organizationRouter: FastifyPluginAsyncZod<
  OrganizationRouterOptions
> = async (fastify, { organizationProcessClient, tokenProvider }) => {
  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info(
        { requestParams: req.params },
        `Getting Organization with ID ${req.params.organizationId}`,
      );

      const token = await tokenProvider.get();
      const headers = getKnodiaServiceHeaders(correlationId, token);

      const { data } = await organizationProcessApi.getOrganization({
        client: organizationProcessClient,
        headers,
        path: { organizationId: req.params.organizationId },
      });

      res.send(toAPI_Organization(data));
    },
    method: "GET",
    schema: {
      description: "Retrieve an Organization",
      operationId: "getOrganization",
      params: API_OrganizationIdPathParam,
      response: {
        200: API_Organization.meta({
          description: "Organization retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        404: API_Problem.meta({ description: "Organization not found" }),
      },
      summary: "Get Organization",
      tags: [apiTags.resource, apiTags.organization],
    },
    url: "/organizations/:organizationId",
  });

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info(
        { requestQuery: req.query },
        "Getting Organizations with params",
      );

      const token = await tokenProvider.get();
      const headers = getKnodiaServiceHeaders(correlationId, token);

      const { data } = await organizationProcessApi.getOrganizations({
        client: organizationProcessClient,
        headers,
        query: req.query,
      });

      res.status(200).send({
        pagination: data.pagination,
        results: data.items.map(toAPI_Organization),
      });
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
      },
      tags: [apiTags.organization],
    },
    url: "/organizations",
  });
};
