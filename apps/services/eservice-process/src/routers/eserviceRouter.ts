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
  API_EserviceVersion,
  API_GetEservicesQueryParams,
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
    handler: async (req, res) => {
      const { results, totalCount } = await eserviceService.getEservices(
        req.query,
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
      headers: processHeaders,
      operationId: "getEservices",
      querystring: API_GetEservicesQueryParams,
      response: {
        200: API_Eservices.meta({
          description: "E-services retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
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
        201: API_Eservice.meta({
          description: "E-service created successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
      },
      tags: [apiTags.eservice],
    },
    url: "/eservices",
  });

  fastify.route({
    handler: (req, res) => {
      const eservice = eserviceService.getMockEservice(req.params.eserviceId);
      res.status(200).send(toAPI_Eservice(eservice));
    },
    method: "GET",
    schema: {
      description: "Retrieve an E-service by its ID",
      headers: processHeaders,
      operationId: "getEservice",
      params: API_EserviceIdPathParam,
      response: {
        200: API_Eservice.meta({
          description: "E-service retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        404: API_Problem.meta({ description: "E-service not found" }),
      },
      tags: [apiTags.eservice],
    },
    url: "/eservices/:eserviceId",
  });

  fastify.route({
    handler: (req, res) => {
      const version = eserviceService.getMockEserviceLatestVersion(
        req.params.eserviceId,
      );
      res.status(200).send(toAPI_EserviceVersion(version));
    },
    method: "GET",
    schema: {
      description: "Retrieve the latest version of an E-service",
      headers: processHeaders,
      operationId: "getEserviceLatestVersion",
      params: API_EserviceIdPathParam,
      response: {
        200: API_EserviceVersion.meta({
          description: "E-service version retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        404: API_Problem.meta({ description: "E-service not found" }),
      },
      tags: [apiTags.eservice],
    },
    url: "/eservices/:eserviceId/versions/latest",
  });
};
