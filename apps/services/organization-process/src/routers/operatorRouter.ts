import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { validateAuthorization } from "@knodia/fastify-zod-api-commons/auth";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import {
  API_Problem,
  KnodiaServiceHeaders,
} from "@knodia/fastify-zod-api-commons/models";

import type { OperatorService } from "../services/operatorService.ts";

import { API_Operators } from "../models/api.ts";
import { toAPI_Operator } from "../models/apiConverter.ts";
import { apiTags } from "../models/apiTags.ts";

export const operatorRouter: FastifyPluginAsyncZod<OperatorService> = async (
  fastify,
  operatorService,
) => {
  fastify.route({
    handler: async (_req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative", "technical"] },
      ]);

      const operators = await operatorService.getOperators(ctx);

      res.status(200).send(operators.map(toAPI_Operator));
    },
    method: "GET",
    schema: {
      description: "Retrieve Operators of the requesting User's Organization",
      headers: KnodiaServiceHeaders,
      operationId: "getOperators",
      response: {
        200: API_Operators.meta({
          description: "Operators retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
      },
      summary: "List Operators",
      tags: [apiTags.operator],
    },
    url: "/operators",
  });
};
