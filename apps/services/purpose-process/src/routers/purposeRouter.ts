import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { unsafeBrandExternalId } from "@knodia/common-models/externalResource";
import { KnodeId, unsafeBrandId } from "@knodia/common-models/ids";
import { validateAuthorization } from "@knodia/fastify-zod-api-commons/auth";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import {
  API_Problem,
  KnodiaServiceHeaders,
  MetadataVersionHeader,
  setMetadataVersionHeader,
} from "@knodia/fastify-zod-api-commons/models";
import {
  API_PurposeFormSchema,
  API_PurposeFormSchemaVersionPathParam,
  API_PurposeFormUiSchema,
  API_PurposeIdPathParam,
} from "@knodia/purpose-models/api";

import type { PurposeService } from "../services/purposeService.ts";

import {
  API_GetPurposesQueryParams,
  API_Purpose,
  API_Purposes,
  API_PurposeSeed,
} from "../models/api.ts";
import { toAPI_Purpose } from "../models/apiConverter.ts";
import { apiTags } from "../models/apiTags.ts";

interface PurposeRouterOptions {
  purposeService: PurposeService;
}

export const purposeRouter: FastifyPluginAsyncZod<
  PurposeRouterOptions
> = async (fastify, { purposeService }) => {
  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "internal" },
      ]);

      const {
        data: purpose,
        metadata: { version },
      } = await purposeService.createPurpose(
        {
          consumer: {
            id: unsafeBrandExternalId(req.body.consumer.id),
            knodeId: KnodeId.parse(req.body.consumer.knodeId),
          },
          dailyCalls: req.body.dailyCalls,
          description: req.body.description,
          eserviceId: unsafeBrandId(req.body.eserviceId),
          formAnswersJson: req.body.formAnswersJson,
          formSchemaVersion: req.body.formSchemaVersion,
          name: req.body.name,
        },
        ctx,
      );

      setMetadataVersionHeader(res, version);
      res.status(201).send(toAPI_Purpose(purpose));
    },
    method: "POST",
    schema: {
      body: API_PurposeSeed,
      description:
        "Create a new Purpose for an E-service on behalf of a consumer",
      headers: KnodiaServiceHeaders,
      operationId: "createPurpose",
      response: {
        201: {
          headers: MetadataVersionHeader,
          properties: API_Purpose.meta({
            description: "Purpose created successfully",
          }),
        },
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Not Found" }),
        409: API_Problem.meta({ description: "Conflict" }),
      },
      summary: "Create Purpose",
      tags: [apiTags.purpose],
    },
    url: "/purposes",
  });

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative", "technical"] },
        { tokenType: "internal" },
      ]);

      const { results, totalCount } = await purposeService.getPurposes(
        req.query,
        ctx,
      );

      res.status(200).send({
        pagination: {
          limit: req.query.limit,
          offset: req.query.offset,
          total: totalCount,
        },
        results: results.map(toAPI_Purpose),
      });
    },
    method: "GET",
    schema: {
      description: "Retrieve a list of Purposes",
      headers: KnodiaServiceHeaders,
      operationId: "getPurposes",
      summary: "List Purposes",
      querystring: API_GetPurposesQueryParams,
      response: {
        200: API_Purposes.meta({
          description: "Purposes retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
      },
      tags: [apiTags.purpose],
    },
    url: "/purposes",
  });

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "internal" },
        {
          tokenType: "ui-session",
          userRoles: ["administrative", "technical"],
        },
      ]);

      const {
        data: purpose,
        metadata: { version },
      } = await purposeService.getPurpose(req.params.purposeId, ctx);

      setMetadataVersionHeader(res, version);
      res.status(200).send(toAPI_Purpose(purpose));
    },
    method: "GET",
    schema: {
      description: "Retrieve a Purpose by its ID",
      headers: KnodiaServiceHeaders,
      operationId: "getPurpose",
      params: API_PurposeIdPathParam,
      response: {
        200: {
          headers: MetadataVersionHeader,
          properties: API_Purpose.meta({
            description: "Purpose retrieved successfully",
          }),
        },
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

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "internal" },
      ]);

      res
        .status(200)
        .send(purposeService.getFormSchema(req.params.version, ctx));
    },
    method: "GET",
    schema: {
      description:
        "Retrieve the JSON Schema for validating Purpose form answers",
      headers: KnodiaServiceHeaders,
      operationId: "getPurposeFormSchema",
      params: API_PurposeFormSchemaVersionPathParam,
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
        { tokenType: "internal" },
      ]);

      res
        .status(200)
        .send(purposeService.getFormUiSchema(req.params.version, ctx));
    },
    method: "GET",
    schema: {
      description:
        "Retrieve the UI Schema for rendering the Purpose form (JSON Forms format)",
      headers: KnodiaServiceHeaders,
      operationId: "getPurposeFormUiSchema",
      params: API_PurposeFormSchemaVersionPathParam,
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
};
