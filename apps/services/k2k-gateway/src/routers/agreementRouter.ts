import type { KnodeId } from "@knodia/common-models/ids";
import type { RefreshableInternalTokenGenerator } from "@knodia/token-generator/refreshable";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import {
  agreementProcessApi,
  type AgreementProcessClient,
} from "@knodia/agreement-process-client";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import { API_Problem } from "@knodia/fastify-zod-api-commons/models";

import {
  API_Agreement,
  API_AgreementIdPathParam,
  API_AgreementSeed,
  API_CreatedAgreementResource,
} from "../models/agreement/api.ts";
import {
  toAPI_Agreement,
  toProcessAPI_AgreementSeed,
} from "../models/agreement/apiConverter.ts";
import { apiTags } from "../models/apiTags.ts";
import { getKnodiaServiceHeaders } from "../utils/headers.ts";

interface AgreementRouterOptions {
  agreementProcessClient: AgreementProcessClient;
  callerKnodeId: KnodeId;
  tokenProvider: RefreshableInternalTokenGenerator;
}

export const agreementRouter: FastifyPluginAsyncZod<
  AgreementRouterOptions
> = async (
  fastify,
  { agreementProcessClient, callerKnodeId, tokenProvider },
) => {
  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info(
        { requestBody: req.body },
        "Creating agreement with body data",
      );

      const token = await tokenProvider.get();
      const headers = getKnodiaServiceHeaders(correlationId, token);

      const { data } = await agreementProcessApi.createAgreement({
        body: toProcessAPI_AgreementSeed(req.body, callerKnodeId),
        client: agreementProcessClient,
        headers,
      });

      res.status(201).send({
        id: data.id,
        producerId: data.producerId,
      });
    },
    method: "POST",
    schema: {
      body: API_AgreementSeed,
      description:
        "Create a new Agreement for a Consumer to access a Producer's E-service",
      operationId: "createAgreement",
      response: {
        201: API_CreatedAgreementResource.meta({
          description: "Agreement created successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        404: API_Problem.meta({ description: "Not Found" }),
        409: API_Problem.meta({ description: "Conflict" }),
      },
      summary: "Create a new Agreement",
      tags: [apiTags.resource, apiTags.agreement],
    },
    url: "/agreements",
  });

  fastify.route({
    handler: async (req, res) => {
      const { correlationId, logger } = getContextValues(requestContext);

      logger.info(`Getting Agreement with ID ${req.params.agreementId}`);

      const token = await tokenProvider.get();
      const headers = getKnodiaServiceHeaders(correlationId, token);

      const { data } = await agreementProcessApi.getAgreement({
        client: agreementProcessClient,
        headers,
        path: { agreementId: req.params.agreementId },
      });

      res.send(toAPI_Agreement(data));
    },
    method: "GET",
    schema: {
      description: "Retrieve an Agreement",
      operationId: "getAgreement",
      params: API_AgreementIdPathParam,
      response: {
        200: API_Agreement.meta({
          description: "Agreement retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        404: API_Problem.meta({ description: "Not Found" }),
      },
      tags: [apiTags.resource, apiTags.agreement],
    },
    url: "/agreements/:agreementId",
  });
};
