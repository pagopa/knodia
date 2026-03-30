import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { KnodeId } from "@knodia/common-models/ids";
import { validateAuthorization } from "@knodia/fastify-zod-api-commons/auth";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import { API_Problem } from "@knodia/fastify-zod-api-commons/models";
import {
  API_ExternalPurposeFormSchemaResponse,
  API_ExternalPurposeFormUiSchemaResponse,
} from "@knodia/purpose-models/api";

import type { PurposeService } from "../services/purposeService.ts";

import { apiTags } from "../models/apiTags.ts";
import {
  API_CreatedPurposeResource,
  API_GetPurposeFormSchemaQueryParams,
  API_PurposeSeed,
} from "../models/purpose/api.ts";

interface PurposeRouterOptions {
  purposeService: PurposeService;
}

export const purposeRouter: FastifyPluginAsyncZod<
  PurposeRouterOptions
> = async (fastify, { purposeService }) => {
  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative"] },
      ]);

      const data = await purposeService.createPurpose(req.body, ctx);

      res.status(201).send(data);
    },
    method: "POST",
    schema: {
      body: API_PurposeSeed,
      description: "Create a new Purpose",
      operationId: "createPurpose",
      response: {
        201: API_CreatedPurposeResource.meta({
          description: "Purpose created successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Not Found" }),
        409: API_Problem.meta({ description: "Conflict" }),
      },
      summary: "Create a Purpose",
      tags: [apiTags.purpose],
    },
    url: "/purposes",
  });

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative", "technical"] },
      ]);

      const data = await purposeService.getCurrentFormSchema(
        KnodeId.parse(req.query.knodeId),
        ctx,
      );
      res.send(data);
    },
    method: "GET",
    schema: {
      description:
        "Retrieve the current JSON Schema for validating Purpose form answers",
      operationId: "getCurrentPurposeFormSchema",
      querystring: API_GetPurposeFormSchemaQueryParams,
      response: {
        200: API_ExternalPurposeFormSchemaResponse.meta({
          description: "Current Purpose form schema retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
      },
      summary: "Get current Purpose form schema",
      tags: [apiTags.purpose],
    },
    url: "/purposes/formSchemas/current",
  });

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative", "technical"] },
      ]);

      const data = await purposeService.getCurrentFormUiSchema(
        KnodeId.parse(req.query.knodeId),
        ctx,
      );
      res.send(data);
    },
    method: "GET",
    schema: {
      description:
        "Retrieve the current UI Schema for rendering the Purpose form",
      operationId: "getCurrentPurposeFormUiSchema",
      querystring: API_GetPurposeFormSchemaQueryParams,
      response: {
        200: API_ExternalPurposeFormUiSchemaResponse.meta({
          description: "Current Purpose form UI schema retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
      },
      summary: "Get current Purpose form UI schema",
      tags: [apiTags.purpose],
    },
    url: "/purposes/formSchemas/current/ui",
  });
};
