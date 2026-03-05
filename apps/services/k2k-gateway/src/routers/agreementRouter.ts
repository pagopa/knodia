import type { RefreshableInternalTokenGenerator } from "@knodia/token-generator/refreshable";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import {
  agreementProcessApi,
  type AgreementProcessClient,
} from "@knodia/agreement-process-client";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import { API_Problem } from "@knodia/fastify-zod-api-commons/models";

import { API_Agreement, API_AgreementSeed } from "../models/agreement/api.ts";
import {
  toAPI_Agreement,
  toProcessAPI_AgreementSeed,
} from "../models/agreement/apiConverter.ts";
import { apiTags } from "../models/apiTags.ts";
import { getKnodiaServiceHeaders } from "../utils/headers.ts";

interface AgreementRouterOptions {
  agreementProcessClient: AgreementProcessClient;
  tokenProvider: RefreshableInternalTokenGenerator;
}

export const agreementRouter: FastifyPluginAsyncZod<
  AgreementRouterOptions
> = async (fastify, { agreementProcessClient, tokenProvider }) => {
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
        body: toProcessAPI_AgreementSeed(req.body),
        client: agreementProcessClient,
        headers,
      });

      res.status(201).send(toAPI_Agreement(data));
    },
    method: "POST",
    schema: {
      body: API_AgreementSeed,
      description:
        "Create a new Agreement for a Consumer to access a Producer's E-service",
      operationId: "createAgreement",
      response: {
        201: API_Agreement.meta({
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
};
