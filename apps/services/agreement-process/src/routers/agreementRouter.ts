import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import { KnodeId, unsafeBrandId } from "@knodia/common-models/ids";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import {
  API_Problem,
  KnodiaServiceHeaders,
} from "@knodia/fastify-zod-api-commons/models";

import type { AgreementService } from "../services/agreementService.ts";

import { API_Agreement, API_AgreementSeed } from "../models/api.ts";
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
      const agreement = await agreementService.createAgreement(
        {
          consumer: {
            id: unsafeBrandId(req.body.consumer.id),
            knodeId: KnodeId.parse(req.body.consumer.knodeId),
          },
          eserviceId: unsafeBrandId(req.body.eserviceId),
          eserviceVersionId: unsafeBrandId(req.body.eserviceVersionId),
        },
        getContextValues(requestContext),
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
        404: API_Problem.meta({ description: "Not Found" }),
        409: API_Problem.meta({ description: "Conflict" }),
      },
      tags: [apiTags.agreement],
    },
    url: "/agreements",
  });
};
