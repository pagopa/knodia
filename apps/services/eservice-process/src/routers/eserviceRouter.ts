import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { API_EserviceIdPathParam } from "@knodia/eservice-models/api";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import {
  API_Problem,
  processHeaders,
} from "@knodia/fastify-zod-api-commons/models";

import type { EserviceService } from "../services/eserviceService.ts";

import {
  API_Eservice,
  API_Eservices,
  API_EserviceSeed,
  API_EservicesQueryParams,
  API_EserviceVersion,
} from "../models/api.ts";
import {
  toAPI_Eservice,
  toAPI_EserviceVersion,
} from "../models/apiConverter.ts";
import { apiTags } from "../models/apiTags.ts";

export const eserviceRouter: FastifyPluginAsyncZod<EserviceService> = async (
  fastify,
  eserviceService,
) => {
  fastify.route({
    handler: (req, res) => {
      const result = eserviceService.getMockEservices(req.query);
      res.status(200).send({
        items: result.items.map(toAPI_Eservice),
        pagination: result.pagination,
      });
    },
    method: "GET",
    schema: {
      description: "Retrieve a list of E-services",
      headers: processHeaders,
      operationId: "getEservices",
      querystring: API_EservicesQueryParams,
      response: {
        200: API_Eservices.describe("E-services retrieved successfully"),
        400: API_Problem.describe("Bad Request"),
      },
      tags: [apiTags.eservice],
    },
    url: "/eservices",
  });

  fastify.route({
    handler: async (req, res) => {
      const ctx = getContextValues(requestContext);
      const eservice = await eserviceService.createEservice(req.body, ctx);
      res.status(201).send(toAPI_Eservice(eservice));
    },
    method: "POST",
    schema: {
      body: API_EserviceSeed,
      description: "Create a new E-service",
      headers: processHeaders,
      operationId: "createEservice",
      response: {
        201: API_Eservice.describe("E-service created successfully"),
        400: API_Problem.describe("Bad Request"),
      },
      tags: [apiTags.eservice],
    },
    url: "/eservices",
  });

  fastify.route({
    handler: (req, res) => {
      const eservice = eserviceService.getMockEserviceById(
        req.params.eserviceId,
      );
      res.status(200).send(toAPI_Eservice(eservice));
    },
    method: "GET",
    schema: {
      description: "Retrieve an E-service by its ID",
      headers: processHeaders,
      operationId: "getEserviceById",
      params: API_EserviceIdPathParam,
      response: {
        200: API_Eservice.describe("E-service retrieved successfully"),
        400: API_Problem.describe("Bad Request"),
        404: API_Problem.describe("E-service not found"),
      },
      tags: [apiTags.eservice],
    },
    url: "/eservices/:eserviceId",
  });

  fastify.route({
    handler: (req, res) => {
      const version = eserviceService.getMockEserviceVersionById(
        req.params.eserviceId,
      );
      res.status(200).send(toAPI_EserviceVersion(version));
    },
    method: "GET",
    schema: {
      description: "Retrieve the latest version of an E-service",
      headers: processHeaders,
      operationId: "getEserviceVersion",
      params: API_EserviceIdPathParam,
      response: {
        200: API_EserviceVersion.describe(
          "E-service version retrieved successfully",
        ),
        400: API_Problem.describe("Bad Request"),
        404: API_Problem.describe("E-service not found"),
      },
      tags: [apiTags.eservice],
    },
    url: "/eservices/:eserviceId/version",
  });
};
