import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { validateAuthorization } from "@knodia/fastify-zod-api-commons/auth";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import {
  API_Problem,
  KnodiaServiceHeaders,
} from "@knodia/fastify-zod-api-commons/models";
import { API_PurposeIdPathParam } from "@knodia/purpose-models/api";

import type { PurposeService } from "../services/purposeService.ts";

import { API_Purpose } from "../models/api.ts";
import { toAPI_Purpose } from "../models/apiConverter.ts";
import { apiTags } from "../models/apiTags.ts";

export const purposeRouter: FastifyPluginAsyncZod<PurposeService> = async (
  fastify,
  purposeService,
) => {
  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative", "technical"] },
      ]);

      const purpose = await purposeService.getPurpose(
        req.params.purposeId,
        ctx,
      );

      res.status(200).send(toAPI_Purpose(purpose));
    },
    method: "GET",
    schema: {
      description: "Retrieve a Purpose by its ID",
      headers: KnodiaServiceHeaders,
      operationId: "getPurpose",
      params: API_PurposeIdPathParam,
      response: {
        200: API_Purpose.meta({
          description: "Purpose retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Purpose not found" }),
      },
      tags: [apiTags.purpose],
    },
    url: "/purposes/:purposeId",
  });
};
