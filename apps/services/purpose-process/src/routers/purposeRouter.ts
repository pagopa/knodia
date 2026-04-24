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
import { PurposeActor } from "@knodia/purpose-models";
import { API_PurposeIdPathParam } from "@knodia/purpose-models/api";

import type { PurposeService } from "../services/purposeService.ts";

import {
  API_CurrentPurposeFormSchemasResponse,
  API_GetPurposesQueryParams,
  API_GetTotalDailyCallsQueryParams,
  API_Purpose,
  API_Purposes,
  API_PurposeSeed,
  API_TotalDailyCalls,
} from "../models/api.ts";
import { toAPI_Purpose } from "../models/apiConverter.ts";
import { apiTags } from "../models/apiTags.ts";

interface PurposeRouterOptions {
  purposeService: PurposeService;
}

export const purposeRouter: FastifyPluginAsyncZod<
  PurposeRouterOptions
  // eslint-disable-next-line max-lines-per-function
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
      querystring: API_GetPurposesQueryParams,
      response: {
        200: API_Purposes.meta({
          description: "Purposes retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
      },
      summary: "List Purposes",
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

      const totalDailyCalls = await purposeService.getTotalDailyCalls(
        req.query,
        ctx,
      );

      res.status(200).send({ totalDailyCalls });
    },
    method: "GET",
    schema: {
      description:
        "Get the total daily API calls declared by Purposes matching the given filters",
      headers: KnodiaServiceHeaders,
      operationId: "getPurposesTotalDailyCalls",
      querystring: API_GetTotalDailyCallsQueryParams,
      response: {
        200: API_TotalDailyCalls.meta({
          description: "Purposes total daily calls retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
      },
      summary: "Get Purposes total daily calls",
      tags: [apiTags.purpose],
    },
    url: "/purposes/totalDailyCalls",
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
    handler: async (_req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "internal" },
      ]);

      res.status(200).send(purposeService.getCurrentPurposeFormSchemas(ctx));
    },
    method: "GET",
    schema: {
      description:
        "Retrieve the current Purpose form schemas (JSON Schema, UI Schema, legal texts, UI texts) with their version",
      headers: KnodiaServiceHeaders,
      operationId: "getCurrentPurposeFormSchemas",
      response: {
        200: API_CurrentPurposeFormSchemasResponse.meta({
          description: "Current Purpose form schemas retrieved successfully",
        }),
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
        { tokenType: "internal" },
      ]);

      const {
        data: purpose,
        metadata: { version },
      } = await purposeService.suspendPurpose(req.params.purposeId, {
        actor: PurposeActor.enum.Consumer,
        ctx,
      });

      setMetadataVersionHeader(res, version);
      res.status(200).send(toAPI_Purpose(purpose));
    },
    method: "POST",
    schema: {
      description: "Suspend a Purpose by Consumer",
      headers: KnodiaServiceHeaders,
      operationId: "suspendPurposeByConsumer",
      params: API_PurposeIdPathParam,
      response: {
        200: {
          headers: MetadataVersionHeader,
          properties: API_Purpose.meta({
            description: "Purpose suspended successfully",
          }),
        },
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Not Found" }),
        409: API_Problem.meta({ description: "Conflict" }),
      },
      summary: "Suspend Purpose by Consumer",
      tags: [apiTags.purpose],
    },
    url: "/purposes/:purposeId/suspendByConsumer",
  });

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative"] },
      ]);

      const {
        data: purpose,
        metadata: { version },
      } = await purposeService.suspendPurpose(req.params.purposeId, {
        actor: PurposeActor.enum.Producer,
        ctx,
      });

      setMetadataVersionHeader(res, version);
      res.status(200).send(toAPI_Purpose(purpose));
    },
    method: "POST",
    schema: {
      description: "Suspend a Purpose by Producer",
      headers: KnodiaServiceHeaders,
      operationId: "suspendPurposeByProducer",
      params: API_PurposeIdPathParam,
      response: {
        200: {
          headers: MetadataVersionHeader,
          properties: API_Purpose.meta({
            description: "Purpose suspended successfully",
          }),
        },
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Not Found" }),
        409: API_Problem.meta({ description: "Conflict" }),
      },
      summary: "Suspend Purpose by Producer",
      tags: [apiTags.purpose],
    },
    url: "/purposes/:purposeId/suspendByProducer",
  });

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "internal" },
      ]);

      const {
        data: purpose,
        metadata: { version },
      } = await purposeService.reactivatePurpose(req.params.purposeId, {
        actor: PurposeActor.enum.Consumer,
        ctx,
      });

      setMetadataVersionHeader(res, version);
      res.status(200).send(toAPI_Purpose(purpose));
    },
    method: "POST",
    schema: {
      description: "Reactivate a Purpose by Consumer",
      headers: KnodiaServiceHeaders,
      operationId: "reactivatePurposeByConsumer",
      params: API_PurposeIdPathParam,
      response: {
        200: {
          headers: MetadataVersionHeader,
          properties: API_Purpose.meta({
            description: "Purpose reactivated successfully",
          }),
        },
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Not Found" }),
        409: API_Problem.meta({ description: "Conflict" }),
      },
      summary: "Reactivate Purpose by Consumer",
      tags: [apiTags.purpose],
    },
    url: "/purposes/:purposeId/reactivateByConsumer",
  });

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative"] },
      ]);

      const {
        data: purpose,
        metadata: { version },
      } = await purposeService.reactivatePurpose(req.params.purposeId, {
        actor: PurposeActor.enum.Producer,
        ctx,
      });

      setMetadataVersionHeader(res, version);
      res.status(200).send(toAPI_Purpose(purpose));
    },
    method: "POST",
    schema: {
      description: "Reactivate a Purpose by Producer",
      headers: KnodiaServiceHeaders,
      operationId: "reactivatePurposeByProducer",
      params: API_PurposeIdPathParam,
      response: {
        200: {
          headers: MetadataVersionHeader,
          properties: API_Purpose.meta({
            description: "Purpose reactivated successfully",
          }),
        },
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Not Found" }),
        409: API_Problem.meta({ description: "Conflict" }),
      },
      summary: "Reactivate Purpose by Producer",
      tags: [apiTags.purpose],
    },
    url: "/purposes/:purposeId/reactivateByProducer",
  });
};
