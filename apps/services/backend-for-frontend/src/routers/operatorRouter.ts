import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import {
  API_Problem,
  getKnodiaServiceHeaders,
} from "@knodia/fastify-zod-api-commons/models";
import {
  organizationProcessApi,
  type OrganizationProcessClient,
} from "@knodia/organization-process-client";

import { apiTags } from "../models/apiTags.ts";
import { API_Operators } from "../models/organization/api.ts";
import { toAPI_Operator } from "../models/organization/apiConverter.ts";

interface OperatorRouterOptions {
  organizationProcessClient: OrganizationProcessClient;
}

export const operatorRouter: FastifyPluginAsyncZod<
  OperatorRouterOptions
> = async (fastify, { organizationProcessClient }) => {
  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info("Getting operators of the requesting organization");

      const { data } = await organizationProcessApi.getOperators({
        client: organizationProcessClient,
        headers: getKnodiaServiceHeaders(req, correlationId),
      });

      res.send(
        data
          .map(toAPI_Operator)
          .toSorted((a, b) => a.username.localeCompare(b.username)),
      );
    },
    method: "GET",
    schema: {
      description: "Retrieve Operators of the requesting User's Organization",
      operationId: "getOperators",
      response: {
        200: API_Operators.meta({
          description: "Operators retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
      },
      tags: [apiTags.operator],
    },
    url: "/operators",
  });
};
