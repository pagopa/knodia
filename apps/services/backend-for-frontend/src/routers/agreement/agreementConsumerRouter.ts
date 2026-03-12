import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requestContext } from "@fastify/request-context";
import {
  agreementProcessApi,
  type AgreementProcessClient,
} from "@knodia/agreement-process-client";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import { API_Problem } from "@knodia/fastify-zod-api-commons/models";

import { API_ConsumerAgreements } from "../../models/agreement/api.ts";
import { apiTags } from "../../models/apiTags.ts";
import { getUISessionAuthData } from "../../utils/authData.ts";
import { getKnodiaServiceHeaders } from "../../utils/headers.ts";

interface AgreementConsumerRouterOptions {
  agreementProcessClient: AgreementProcessClient;
}

export const agreementConsumerRouter: FastifyPluginAsyncZod<
  AgreementConsumerRouterOptions
> = async (fastify, { agreementProcessClient }) => {
  fastify.route({
    handler: async (req, res) => {
      const { authData, correlationId, logger } =
        getContextValues(requestContext);
      const { organizationId: consumerId } = getUISessionAuthData(authData);
      console.log("🚀 ~ agreementConsumerRouter ~ consumerId:", consumerId);

      logger.info(`Getting Consumer Agreements for consumer ID ${consumerId}`);

      const [
        { data: activeAgreements },
        { data: suspendedAgreements },
        { data: archivedAgreements },
      ] = await Promise.all([
        agreementProcessApi.getAgreements({
          client: agreementProcessClient,
          headers: getKnodiaServiceHeaders(req, correlationId),
          query: {
            consumerId,
            limit: 1,
            offset: 0,
            state: ["Active"],
          },
        }),
        agreementProcessApi.getAgreements({
          client: agreementProcessClient,
          headers: getKnodiaServiceHeaders(req, correlationId),
          query: {
            consumerId,
            limit: 1,
            offset: 0,
            state: ["Suspended"],
          },
        }),
        agreementProcessApi.getAgreements({
          client: agreementProcessClient,
          headers: getKnodiaServiceHeaders(req, correlationId),
          query: {
            consumerId,
            limit: 1,
            offset: 0,
            state: ["Archived"],
          },
        }),
      ]);

      res.status(200).send({
        counters: {
          activeAgreements: activeAgreements.pagination.total,
          archivedAgreements: archivedAgreements.pagination.total,
          suspendedAgreements: suspendedAgreements.pagination.total,
        },
      });
    },
    method: "GET",
    schema: {
      description: "Retrieve a list of Consumer Agreements",
      operationId: "getConsumerAgreements",
      response: {
        200: API_ConsumerAgreements.meta({
          description: "Consumer Agreements retrieved successfully",
        }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
      },
      tags: [apiTags.agreement],
    },
    url: "/consumer/agreements",
  });
};
