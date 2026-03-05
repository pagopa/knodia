import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import { API_Problem } from "@knodia/fastify-zod-api-commons/models";

import type { AgreementService } from "../services/agreementService.ts";

import { API_Agreement, API_AgreementSeed } from "../models/agreement/api.ts";
import { apiTags } from "../models/apiTags.ts";

interface AgreementRouterOptions {
  agreementService: AgreementService;
}

export const agreementRouter: FastifyPluginAsyncZod<
  AgreementRouterOptions
> = async (fastify, { agreementService }) => {
  fastify.route({
    handler: async (req, res) => {
      const agreement = await agreementService.createAgreement(
        req.body,
        getContextValues(requestContext),
      );

      res.status(201).send(agreement);
    },
    method: "POST",
    schema: {
      body: API_AgreementSeed,
      description: "Create a new Agreement",
      operationId: "createAgreement",
      response: {
        201: API_Agreement.meta({
          description: "Agreement created successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
      },
      tags: [apiTags.agreement],
    },
    url: "/agreements",
  });
};
