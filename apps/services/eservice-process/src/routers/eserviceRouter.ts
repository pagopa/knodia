import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

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
} from "../models/api.ts";
import { toAPI_Eservice } from "../models/apiConverter.ts";
import { apiTags } from "../models/apiTags.ts";

export const eserviceRouter: FastifyPluginAsyncZod<EserviceService> = async (
  fastify,
  eserviceService,
) => {
  fastify.route({
    handler: (req, res) => {
      const eservices = eserviceService.getMockEservices(
        req.query.offset,
        req.query.limit,
      );
      res.status(200).send({
        items: eservices.items.map(toAPI_Eservice),
        pagination: eservices.pagination,
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
    handler: (req, res) => {
      const eservice = eserviceService.createEservice(req.body, req.log);
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
};
