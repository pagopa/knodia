import type { AgreementId } from "@knodia/common-models/ids";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { API_AgreementIdPathParam } from "@knodia/agreement-models/api";
import { unsafeBrandExternalId } from "@knodia/common-models/externalResource";
import { KnodeId } from "@knodia/common-models/ids";
import { validateAuthorization } from "@knodia/fastify-zod-api-commons/auth";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import { API_Problem } from "@knodia/fastify-zod-api-commons/models";

import type { AgreementService } from "../services/agreementService.ts";

import {
  API_Agreement,
  API_Agreements,
  API_AgreementSeed,
  API_CreatedAgreementResource,
  API_GetAgreementQueryParams,
  API_GetAgreementsQueryParams,
} from "../models/agreement/api.ts";
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
        { tokenType: "ui-session", userRoles: ["administrative"] },
      ]);

      const data = await agreementService.createAgreement(req.body, ctx);

      res.status(201).send(data);
    },
    method: "POST",
    schema: {
      body: API_AgreementSeed,
      description: "Create a new Agreement",
      operationId: "createAgreement",
      response: {
        201: API_CreatedAgreementResource.meta({
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

      const data = await agreementService.getAgreements(req.query, ctx);

      res.status(200).send(data);
    },
    method: "GET",
    schema: {
      description: "Retrieve a list of Agreements",
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
      ]);

      const data = await agreementService.getAgreement(
        unsafeBrandExternalId<AgreementId>(req.params.agreementId),
        KnodeId.parse(req.query.knodeId),
        ctx,
      );

      res.send(data);
    },
    method: "GET",
    schema: {
      description: "Retrieve an Agreement by its ID",
      operationId: "getAgreement",
      params: API_AgreementIdPathParam,
      querystring: API_GetAgreementQueryParams,
      response: {
        200: API_Agreement.meta({
          description: "Agreement retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
        404: API_Problem.meta({ description: "Agreement not found" }),
      },
      summary: "Get Agreement detail",
      tags: [apiTags.agreement],
    },
    url: "/agreements/:agreementId",
  });
};
