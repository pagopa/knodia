import type { KnodeId } from "@knodia/common-models/ids";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import {
  API_Problem,
  forbiddenError,
  getKnodiaServiceHeaders,
} from "@knodia/fastify-zod-api-commons/models";
import {
  organizationProcessApi,
  type OrganizationProcessClient,
} from "@knodia/organization-process-client";
import { isAxiosError } from "axios";

import { apiTags } from "../models/apiTags.ts";
import { API_SessionOrganization } from "../models/organization/api.ts";
import { toAPI_SessionOrganization } from "../models/organization/apiConverter.ts";
import { getUISessionAuthData } from "../utils/authData.ts";

interface SessionRouterOptions {
  knodeId: KnodeId;
  organizationProcessClient: OrganizationProcessClient;
}

export const sessionRouter: FastifyPluginAsyncZod<
  SessionRouterOptions
> = async (fastify, { knodeId, organizationProcessClient }) => {
  fastify.route({
    handler: async (req, res) => {
      const { authData, correlationId, logger } =
        getContextValues(requestContext);
      const { organizationId } = getUISessionAuthData(authData);

      logger.info("Getting organization info for the current session");

      try {
        const { data } = await organizationProcessApi.getOrganization({
          client: organizationProcessClient,
          headers: getKnodiaServiceHeaders(req, correlationId),
          path: { organizationId },
        });

        res.send(toAPI_SessionOrganization(data, knodeId));
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 404) {
          throw forbiddenError(`Organization ${organizationId} not found`);
        }
        throw error;
      }
    },
    method: "GET",
    schema: {
      description: "Retrieve the Organization of the current session's User",
      operationId: "getSessionOrganization",
      response: {
        200: API_SessionOrganization.meta({
          description: "Session Organization retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        429: API_Problem.meta({ description: "Too Many Requests" }),
      },
      summary: "Get a Session Organization",
      tags: [apiTags.auth],
    },
    url: "/session/organization",
  });
};
