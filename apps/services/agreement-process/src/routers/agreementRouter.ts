import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { API_AgreementIdPathParam } from "@knodia/agreement-models/api";
import {
  KnodeId,
  unsafeBrandExternalId,
  unsafeBrandId,
} from "@knodia/common-models/ids";
import { validateAuthorization } from "@knodia/fastify-zod-api-commons/auth";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import {
  API_Problem,
  KnodiaServiceHeaders,
} from "@knodia/fastify-zod-api-commons/models";

import type { AgreementService } from "../services/agreementService.ts";

import {
  API_Agreement,
  API_Agreements,
  API_AgreementSeed,
  API_GetAgreementsQueryParams,
} from "../models/api.ts";
import { toAPI_Agreement } from "../models/apiConverter.ts";
import { apiTags } from "../models/apiTags.ts";

interface AgreementRouterOptions {
  agreementService: AgreementService;
}

export const agreementRouter: FastifyPluginAsyncZod<
  AgreementRouterOptions
> = async (fastify, { agreementService }) => {
  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "internal" },
      ]);

      const agreement = await agreementService.createAgreement(
        {
          consumer: {
            id: unsafeBrandExternalId(req.body.consumer.id),
            knodeId: KnodeId.parse(req.body.consumer.knodeId),
          },
          eserviceId: unsafeBrandId(req.body.eserviceId),
          eserviceVersionId: unsafeBrandId(req.body.eserviceVersionId),
        },
        ctx,
      );

      res.status(201).send(toAPI_Agreement(agreement));
    },
    method: "POST",
    schema: {
      body: API_AgreementSeed,
      description: "Create a new Agreement",
      headers: KnodiaServiceHeaders,
      operationId: "createAgreement",
      response: {
        201: API_Agreement.meta({
          description: "Agreement created successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Not Found" }),
        409: API_Problem.meta({ description: "Conflict" }),
      },
      tags: [apiTags.agreement],
    },
    url: "/agreements",
  });

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative", "technical"] },
      ]);

      const { results, totalCount } = await agreementService.getAgreements(
        req.query,
        ctx,
      );

      res.status(200).send({
        items: results.map(toAPI_Agreement),
        pagination: {
          limit: req.query.limit,
          offset: req.query.offset,
          total: totalCount,
        },
      });
    },
    method: "GET",
    schema: {
      description: "Retrieve a list of Agreements",
      headers: KnodiaServiceHeaders,
      operationId: "getAgreements",
      querystring: API_GetAgreementsQueryParams,
      response: {
        200: API_Agreements.meta({
          description: "Agreements retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
      },
      tags: [apiTags.agreement],
    },
    url: "/agreements",
  });

  fastify.route({
    handler: async (req, res) => {
      const ctx = validateAuthorization(getContextValues(requestContext), [
        { tokenType: "ui-session", userRoles: ["administrative", "technical"] },
        { tokenType: "internal" },
      ]);

      const agreement = await agreementService.getAgreement(
        req.params.agreementId,
        ctx,
      );

      res.status(200).send(toAPI_Agreement(agreement));
    },
    method: "GET",
    schema: {
      description: "Retrieve an Agreement by its ID",
      headers: KnodiaServiceHeaders,
      operationId: "getAgreement",
      params: API_AgreementIdPathParam,
      response: {
        200: API_Agreement.meta({
          description: "Agreement retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Not Found" }),
      },
      tags: [apiTags.agreement],
    },
    url: "/agreements/:agreementId",
  });
};
