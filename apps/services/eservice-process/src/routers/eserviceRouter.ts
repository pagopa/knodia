import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { unsafeBrandId } from "@knodia/common-models/ids";
import { API_EserviceIdPathParam } from "@knodia/eservice-models/api";
import { validateAuthorization } from "@knodia/fastify-zod-api-commons/auth";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import {
  API_Problem,
  KnodiaServiceHeaders,
} from "@knodia/fastify-zod-api-commons/models";

import type { EserviceService } from "../services/eserviceService.ts";

import {
  API_Eservice,
  API_Eservices,
  API_EserviceSeed,
  API_EserviceVersion,
  API_EserviceVersionInterfaceDocument,
  API_GetCatalogEserviceSearchParams,
  API_GetCatalogEservicesQueryParams,
  API_GetEservicesQueryParams,
} from "../models/api.ts";
import {
  toAPI_Eservice,
  toAPI_EserviceVersion,
  toAPI_EserviceVersionInterfaceDocument,
} from "../models/apiConverter.ts";
import { apiTags } from "../models/apiTags.ts";

// eslint-disable-next-line max-lines-per-function
export const eserviceRouter: FastifyPluginAsyncZod<EserviceService> = async (
  fastify,
  eserviceService,
) => {
  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative", "technical"] },
      ]);

      const { results, totalCount } = await eserviceService.getEservices(
        req.query,
        ctx,
      );

      res.status(200).send({
        items: results.map(toAPI_Eservice),
        pagination: {
          limit: req.query.limit,
          offset: req.query.offset,
          total: totalCount,
        },
      });
    },
    method: "GET",
    schema: {
      description: "Retrieve a list of E-services",
      headers: KnodiaServiceHeaders,
      operationId: "getEservices",
      querystring: API_GetEservicesQueryParams,
      response: {
        200: API_Eservices.meta({
          description: "E-services retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        403: API_Problem.meta({ description: "Forbidden" }),
      },
      tags: [apiTags.eservice],
    },
    url: "/eservices",
  });

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["technical"] },
      ]);

      const eservice = await eserviceService.createEservice(req.body, ctx);
      res.status(201).send(toAPI_Eservice(eservice));
    },
    method: "POST",
    schema: {
      body: API_EserviceSeed,
      description: "Create a new E-service",
      headers: KnodiaServiceHeaders,
      operationId: "createEservice",
      response: {
        201: API_Eservice.meta({
          description: "E-service created successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        409: API_Problem.meta({ description: "Conflict" }),
      },
      tags: [apiTags.eservice],
    },
    url: "/eservices",
  });

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative", "technical"] },
      ]);

      const eservice = await eserviceService.getEservice(
        req.params.eserviceId,
        ctx,
      );

      res.status(200).send(toAPI_Eservice(eservice));
    },
    method: "GET",
    schema: {
      description: "Retrieve an E-service by its ID",
      headers: KnodiaServiceHeaders,
      operationId: "getEservice",
      params: API_EserviceIdPathParam,
      response: {
        200: API_Eservice.meta({
          description: "E-service retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "E-service not found" }),
      },
      tags: [apiTags.eservice],
    },
    url: "/eservices/:eserviceId",
  });

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "internal" },
        { tokenType: "ui-session", userRoles: ["administrative", "technical"] },
      ]);

      const eserviceVersion = await eserviceService.getEserviceLatestVersion(
        req.params.eserviceId,
        ctx,
      );

      res.status(200).send(toAPI_EserviceVersion(eserviceVersion));
    },
    method: "GET",
    schema: {
      description: "Retrieve the latest version of an E-service",
      headers: KnodiaServiceHeaders,
      operationId: "getEserviceLatestVersion",
      params: API_EserviceIdPathParam,
      response: {
        200: API_EserviceVersion.meta({
          description: "E-service version retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "E-service not found" }),
      },
      tags: [apiTags.eservice],
    },
    url: "/eservices/:eserviceId/versions/latest",
  });

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative", "technical"] },
      ]);

      const eserviceVersionInterface =
        await eserviceService.getEserviceLatestVersionInterface(
          unsafeBrandId(req.params.eserviceId),
          ctx,
        );
      res
        .status(200)
        .send(toAPI_EserviceVersionInterfaceDocument(eserviceVersionInterface));
    },
    method: "GET",
    schema: {
      description:
        "Retrieve the interface document of the latest E-service version",
      headers: KnodiaServiceHeaders,
      operationId: "getEserviceLatestVersionInterface",
      params: API_EserviceIdPathParam,
      response: {
        200: API_EserviceVersionInterfaceDocument.meta({
          description:
            "E-service version interface document retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Not Found" }),
      },
      tags: [apiTags.eservice],
    },
    url: "/eservices/:eserviceId/versions/latest/interface",
  });

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "internal" },
      ]);

      const { results, totalCount } = await eserviceService.getCatalogEservices(
        req.body,
        req.query,
        ctx,
      );

      res.status(200).send({
        items: results.map(toAPI_Eservice),
        pagination: {
          limit: req.query.limit,
          offset: req.query.offset,
          total: totalCount,
        },
      });
    },
    method: "POST",
    schema: {
      body: API_GetCatalogEserviceSearchParams,
      description:
        "Retrieve a list of E-services based on complex search criteria contained in the request body",
      headers: KnodiaServiceHeaders,
      operationId: "getCatalogEservices",
      querystring: API_GetCatalogEservicesQueryParams,
      response: {
        200: API_Eservices.meta({
          description: "E-services retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        403: API_Problem.meta({ description: "Forbidden" }),
      },
      tags: [apiTags.eservice],
    },
    url: "/catalog",
  });
};
