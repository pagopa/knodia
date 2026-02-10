import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { API_ProducerEservices } from "@knodia/eservice-models/api";
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
  API_GetProducerEservicesQueryParams,
} from "../models/api.ts";
import {
  toAPI_Eservice,
  toAPI_ProducerEservice,
} from "../models/apiConverter.ts";
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
    handler: async (req, res) => {
      const { results, totalCount } =
        await eserviceService.getProducerEservices(req.query);
      res.status(200).send({
        items: results.map(toAPI_ProducerEservice),
        pagination: {
          limit: req.query.limit,
          offset: req.query.offset,
          total: totalCount,
        },
      });
    },
    method: "GET",
    schema: {
      description:
        "Retrieve a list of E-services produced by the logged-in tenant",
      headers: processHeaders,
      operationId: "getProducerEservices",
      querystring: API_GetProducerEservicesQueryParams,
      response: {
        200: API_ProducerEservices.describe(
          "E-services retrieved successfully",
        ),
        400: API_Problem.describe("Bad Request"),
      },
      tags: [apiTags.eservice],
    },
    url: "/producer/eservices",
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
};
