/* eslint-disable max-lines-per-function */
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { unsafeBrandExternalId } from "@knodia/common-models/externalResource";
import { KnodeId, type PurposeId } from "@knodia/common-models/ids";
import { validateAuthorization } from "@knodia/fastify-zod-api-commons/auth";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import { API_Problem } from "@knodia/fastify-zod-api-commons/models";
import {
  API_ExternalPurposeFormSchemasResponse,
  API_PurposeIdPathParam,
} from "@knodia/purpose-models/api";

import type { PurposeService } from "../services/purposeService.ts";

import { apiTags } from "../models/apiTags.ts";
import {
  API_CreatedPurposeResource,
  API_GetPurposeFormSchemaQueryParams,
  API_GetPurposeQueryParams,
  API_GetPurposesQueryParams,
  API_Purpose,
  API_Purposes,
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

      const data = await purposeService.archivePurpose(
        unsafeBrandExternalId<PurposeId>(req.params.purposeId),
        KnodeId.parse(req.query.knodeId),
        ctx,
      );

      res.send(data);
    },
    method: "POST",
    schema: {
      description:
        "Archive a Purpose on behalf of its Consumer; the Consumer must be the caller organization",
      operationId: "archivePurpose",
      params: API_PurposeIdPathParam,
      querystring: API_GetPurposeQueryParams,
      response: {
        200: API_Purpose.meta({
          description: "Purpose archived successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Purpose not found" }),
        409: API_Problem.meta({ description: "Conflict" }),
      },
      summary: "Archive a Purpose",
      tags: [apiTags.purpose],
    },
    url: "/purposes/:purposeId/archive",
  });

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

      const data = await purposeService.getCurrentPurposeFormSchemas(
        KnodeId.parse(req.query.knodeId),
        ctx,
      );
      res.send(data);
    },
    method: "GET",
    schema: {
      description:
        "Retrieve the current Purpose form schemas (JSON Schema, UI Schema, legal texts, UI texts) with their version",
      operationId: "getCurrentPurposeFormSchemas",
      querystring: API_GetPurposeFormSchemaQueryParams,
      response: {
        200: API_ExternalPurposeFormSchemasResponse.meta({
          description: "Current Purpose form schemas retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
      },
      summary: "Get current Purpose form schemas",
      tags: [apiTags.purpose],
    },
    url: "/purposes/formSchemas/current",
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

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative"] },
      ]);

      const data = await purposeService.reactivatePurpose(
        unsafeBrandExternalId<PurposeId>(req.params.purposeId),
        KnodeId.parse(req.query.knodeId),
        ctx,
      );

      res.send(data);
    },
    method: "POST",
    schema: {
      description:
        "Reactivate a Purpose on behalf of its Consumer; the Consumer must be the caller organization",
      operationId: "reactivatePurpose",
      params: API_PurposeIdPathParam,
      querystring: API_GetPurposeQueryParams,
      response: {
        200: API_Purpose.meta({
          description: "Purpose reactivated successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Purpose not found" }),
        409: API_Problem.meta({ description: "Conflict" }),
      },
      summary: "Reactivate a Purpose",
      tags: [apiTags.purpose],
    },
    url: "/purposes/:purposeId/reactivate",
  });

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative"] },
      ]);

      const data = await purposeService.suspendPurpose(
        unsafeBrandExternalId<PurposeId>(req.params.purposeId),
        KnodeId.parse(req.query.knodeId),
        ctx,
      );

      res.send(data);
    },
    method: "POST",
    schema: {
      description:
        "Suspend a Purpose on behalf of its Consumer; the Consumer must be the caller organization",
      operationId: "suspendPurpose",
      params: API_PurposeIdPathParam,
      querystring: API_GetPurposeQueryParams,
      response: {
        200: API_Purpose.meta({
          description: "Purpose suspended successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Purpose not found" }),
        409: API_Problem.meta({ description: "Conflict" }),
      },
      summary: "Suspend a Purpose",
      tags: [apiTags.purpose],
    },
    url: "/purposes/:purposeId/suspend",
  });

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative", "technical"] },
      ]);

      const data = await purposeService.getPurposes(req.query, ctx);

      res.status(200).send(data);
    },
    method: "GET",
    schema: {
      description: "Retrieve a list of Purposes",
      operationId: "getPurposes",
      querystring: API_GetPurposesQueryParams,
      response: {
        200: API_Purposes.meta({
          description: "Purposes retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
      },
      summary: "Get Purposes",
      tags: [apiTags.purpose],
    },
    url: "/purposes",
  });
};
