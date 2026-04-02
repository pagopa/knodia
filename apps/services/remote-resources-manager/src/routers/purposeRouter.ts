import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { unsafeBrandExternalId } from "@knodia/common-models/externalResource";
import { KnodeId } from "@knodia/common-models/ids";
import { validateAuthorization } from "@knodia/fastify-zod-api-commons/auth";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import { API_Problem } from "@knodia/fastify-zod-api-commons/models";
import {
  API_PurposeFormSchema,
  API_PurposeFormSchemaVersionPathParam,
  API_PurposeFormUiSchema,
  API_PurposeIdPathParam,
} from "@knodia/purpose-models/api";

import type { PurposeService } from "../services/purposeService.ts";

import { apiTags } from "../models/apiTags.ts";
import {
  API_CreatedPurposeResource,
  API_GetPurposeFormSchemaQueryParams,
  API_GetPurposeQueryParams,
  API_Purpose,
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

      const data = await purposeService.getPurposeFormSchema(
        req.params.version,
        KnodeId.parse(req.query.knodeId),
        ctx,
      );
      res.send(data);
    },
    method: "GET",
    schema: {
      description:
        "Retrieve the JSON Schema for validating Purpose form answers",
      operationId: "getPurposeFormSchema",
      params: API_PurposeFormSchemaVersionPathParam,
      querystring: API_GetPurposeFormSchemaQueryParams,
      response: {
        200: API_PurposeFormSchema.meta({
          description: "Purpose form schema retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
      },
      summary: "Get Purpose form schema by version",
      tags: [apiTags.purpose],
    },
    url: "/purposes/formSchemas/:version",
  });

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative", "technical"] },
      ]);

      const data = await purposeService.getPurposeFormUiSchema(
        req.params.version,
        KnodeId.parse(req.query.knodeId),
        ctx,
      );
      res.send(data);
    },
    method: "GET",
    schema: {
      description:
        "Retrieve the UI Schema for rendering the Purpose form (JSON Forms format)",
      operationId: "getPurposeFormUiSchema",
      params: API_PurposeFormSchemaVersionPathParam,
      querystring: API_GetPurposeFormSchemaQueryParams,
      response: {
        200: API_PurposeFormUiSchema.meta({
          description: "Purpose form UI schema retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
      },
      summary: "Get Purpose form UI schema by version",
      tags: [apiTags.purpose],
    },
    url: "/purposes/formSchemas/:version/ui",
  });

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative", "technical"] },
      ]);

      const data = await purposeService.getPurpose(
        {
          knodeId: KnodeId.parse(req.query.knodeId),
          purposeId: unsafeBrandExternalId(req.params.purposeId),
        },
        ctx,
      );

      res.status(200).send(data);
    },
    method: "GET",
    schema: {
      description: "Retrieve a Purpose by its ID",
      operationId: "getPurpose",
      params: API_PurposeIdPathParam,
      querystring: API_GetPurposeQueryParams,
      response: {
        200: API_Purpose.meta({
          description: "Purpose retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Purpose not found" }),
      },
      summary: "Get Purpose",
      tags: [apiTags.purpose],
    },
    url: "/purposes/:purposeId",
  });
};
